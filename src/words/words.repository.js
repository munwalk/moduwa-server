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
   * @returns {Promise<Object>}
   */
  async createUserWord(userId, categoryId, word, imageUrl, displayOrder) {
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
        partOfSpeech: 'NOUN', // 임시값: 나중에 파이썬으로 자동 분류
        customWord: word,
        customImageUrl: imageUrl,
        displayOrder,
        isFavorite: false,
        isDeleted: false
      }
    });
  }
}

export default new WordsRepository();
