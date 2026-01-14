import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Words Repository
 */
export class WordsRepository {
  /**
   * 기본 낱말(Word) 조회
   * @param {string|null} categoryId - Category.id
   * @returns {Promise<Array>}
   */
  async findWords(categoryId = null) {
    const where = { isDefault: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return await prisma.word.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * 카테고리 조회 (Category 또는 UserCategory)
   * @param {string} categoryId - Category.id 또는 UserCategory.id
   * @returns {Promise<Object|null>}
   */
  async findCategoryById(categoryId) {
    // Category 테이블에서 조회
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (category) {
      return category;
    }

    // UserCategory 테이블에서 조회
    const userCategory = await prisma.userCategory.findUnique({
      where: { id: categoryId }
    });
    
    return userCategory;
  }

  /**
   * 사용자 개인 낱말(UserWord) 조회
   * @param {string} userId
   * @param {string|null} categoryId - Category.id 또는 UserCategory.id
   * @param {boolean} onlyFavorite
   * @returns {Promise<Array>}
   */
  async findUserWords(userId, categoryId = null, onlyFavorite = false) {
    const where = {
      userId,
      isDeleted: false
    };

    if (categoryId) {
      where.OR = [
        { categoryId: categoryId },
        { userCategoryId: categoryId }
      ];
    }

    if (onlyFavorite) {
      where.isFavorite = true;
    }

    return await prisma.userWord.findMany({
      where,
      include: {
        word: true,
        category: true,
        userCategory: true
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * 특정 Word에 대한 UserWord 존재 여부 확인
   * @param {string} userId
   * @param {string} wordId
   * @returns {Promise<Object|null>}
   */
  async findUserWordByWordId(userId, wordId) {
    return await prisma.userWord.findFirst({
      where: {
        userId,
        wordId,
        isDeleted: false
      }
    });
  }

  /**
   * 사용자 개인 낱말 생성
   * @param {string} userId
   * @param {string} categoryId - Category.id 또는 UserCategory.id
   * @param {string} word
   * @param {string} imageUrl
   * @param {number} displayOrder
   * @param {string} partOfSpeech - 품사 (NLP 자동 분류)
   * @returns {Promise<Object>}
   */
  async createUserWord(userId, categoryId, word, imageUrl, displayOrder, partOfSpeech = 'NOUN') {
    // categoryId가 UserCategory 확인
    const userCategory = await prisma.userCategory.findUnique({
      where: { id: categoryId }
    });

    const isUserCategory = !!userCategory;

    return await prisma.userWord.create({
      data: {
        userId,
        categoryId: isUserCategory ? null : categoryId,
        userCategoryId: isUserCategory ? categoryId : null,
        partOfSpeech: partOfSpeech, // NLP 서비스에서 받은 품사
        customWord: word,
        customImageUrl: imageUrl,
        displayOrder,
        isFavorite: false,
        isDeleted: false
      }
    });
  }

  /**
   * Word 조회 (단일)
   * @param {string} wordId - Word.id
   * @returns {Promise<Object|null>}
   */
  async findWordById(wordId) {
    return await prisma.word.findUnique({
      where: { id: wordId },
      include: { category: true }
    });
  }

  /**
   * UserWord 조회 (단일)
   * @param {string} userWordId - UserWord.id
   * @returns {Promise<Object|null>}
   */
  async findUserWordById(userWordId) {
    return await prisma.userWord.findUnique({
      where: { id: userWordId },
      include: {
        word: true,
        category: true,
        userCategory: true
      }
    });
  }

  /**
   * 즐겨찾기용 UserWord 생성 (기본 낱말 참조)
   * @param {string} userId
   * @param {string} wordId - Word.id
   * @param {number} displayOrder
   * @returns {Promise<Object>}
   */
  async createUserWordForFavorite(userId, wordId, displayOrder) {
    const word = await this.findWordById(wordId);
    
    return await prisma.userWord.create({
      data: {
        userId,
        wordId,
        categoryId: word.categoryId,
        partOfSpeech: word.partOfSpeech,
        displayOrder,
        isFavorite: true,
        isDeleted: false
      }
    });
  }

  /**
   * UserWord 즐겨찾기 상태 변경
   * @param {string} userWordId - UserWord.id
   * @param {boolean} isFavorite
   * @returns {Promise<Object>}
   */
  async updateUserWordFavorite(userWordId, isFavorite) {
    return await prisma.userWord.update({
      where: { id: userWordId },
      data: { isFavorite }
    });
  }

  /**
   * UserWord 삭제
   * @param {string} userWordId - UserWord.id
   * @returns {Promise<Object>}
   */
  async deleteUserWord(userWordId) {
    return await prisma.userWord.delete({
      where: { id: userWordId }
    });
  }

  /**
   * 낱말 수정용 UserWord 생성 (기본 낱말 참조)
   * @param {string} userId
   * @param {string} wordId - Word.id
   * @param {string|null} customWord
   * @param {string|null} customImageUrl
   * @param {number} displayOrder
   * @returns {Promise<Object>}
   */
  async createUserWordForEdit(userId, wordId, customWord, customImageUrl, displayOrder) {
    const word = await this.findWordById(wordId);
    
    return await prisma.userWord.create({
      data: {
        userId,
        wordId,
        categoryId: word.categoryId,
        partOfSpeech: word.partOfSpeech,
        customWord,
        customImageUrl,
        displayOrder,
        isFavorite: false,
        isDeleted: false
      },
      include: {
        word: true,
        category: true
      }
    });
  }

  /**
   * UserWord 업데이트 (customWord, customImageUrl)
   * @param {string} userWordId - UserWord.id
   * @param {string|null} customWord
   * @param {string|null} customImageUrl
   * @returns {Promise<Object>}
   */
  async updateUserWord(userWordId, customWord, customImageUrl) {
    const data = {};
    if (customWord !== undefined) data.customWord = customWord;
    if (customImageUrl !== undefined) data.customImageUrl = customImageUrl;

    return await prisma.userWord.update({
      where: { id: userWordId },
      data,
      include: {
        word: true,
        category: true,
        userCategory: true
      }
    });
  }
}

export default new WordsRepository();
