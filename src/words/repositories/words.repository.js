import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Words Repository
 */
export class WordsRepository {
  /**
   * 기본 낱말(Word) 조회
   * @param {string|null} categoryId - Category.id 또는 UserCategory.id
   * @param {string|null} userId - 사용자 ID (UserCategory 조회용)
   * @returns {Promise<Array>}
   */
  async findWords(categoryId = null, userId = null) {
    const where = { isDefault: true };
    
    if (categoryId) {
      // UserCategory인지 확인
      const userCategory = await prisma.userCategory.findUnique({
        where: { id: categoryId }
      });
      
      if (userCategory) {
        // UserCategory면 categoryName으로 Category 찾기
        const category = await prisma.category.findFirst({
          where: { 
            categoryName: userCategory.categoryName,
            isDefault: true
          }
        });
        
        if (category) {
          where.categoryId = category.id;
        } else {
          // 사용자 커스텀 카테고리는 기본 Word가 없음
          return [];
        }
      } else {
        // Category.id를 직접 전달한 경우 (하위 호환성)
        where.categoryId = categoryId;
      }
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
   * 사용자 카테고리 이름으로 조회
   * @param {string} userId
   * @param {string} categoryName
   * @returns {Promise<Object|null>}
   */
  async findUserCategoryByName(userId, categoryName) {
    return await prisma.userCategory.findFirst({
      where: {
        userId,
        categoryName
      }
    });
  }

  /**
   * 사용자의 모든 카테고리 조회
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async findAllUserCategories(userId) {
    return await prisma.userCategory.findMany({
      where: { userId },
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * 모든 기본 카테고리 조회
   * @returns {Promise<Array>}
   */
  async findAllCategories() {
    return await prisma.category.findMany({
      where: { isDefault: true },
      orderBy: { displayOrder: 'asc' }
    });
  }

  /**
   * 사용자 개인 낱말(UserWord) 조회
   * @param {string} userId
   * @param {string|null} categoryId - Category.id 또는 UserCategory.id
   * @param {boolean} onlyFavorite
   * @param {boolean} includeDeleted - isDeleted=true인 것도 포함할지 여부
   * @returns {Promise<Array>}
   */
  async findUserWords(userId, categoryId = null, onlyFavorite = false, includeDeleted = false) {
    const where = {
      userId
    };

    // includeDeleted가 false면 isDeleted=false만 조회
    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (categoryId) {
      where.userCategoryId = categoryId;
    }

    if (onlyFavorite) {
      where.isFavorite = true;
    }

    return await prisma.userWord.findMany({
      where,
      include: {
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
   * @param {string|null} categoryId - 사용자가 지정한 카테고리 ID (없으면 word.categoryId 사용)
   * @returns {Promise<Object>}
   */
  async createUserWordForEdit(userId, wordId, customWord, customImageUrl, displayOrder, categoryId) {
    const word = await this.findWordById(wordId);
    
    return await prisma.userWord.create({
      data: {
        userId,
        wordId,
        categoryId: categoryId || word.categoryId,
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
   * UserWord 업데이트 (customWord, customImageUrl, categoryId)
   * @param {string} userWordId - UserWord.id
   * @param {string|null} customWord
   * @param {string|null} customImageUrl
   * @param {string|null} categoryId
   * @returns {Promise<Object>}
   */
  async updateUserWord(userWordId, customWord, customImageUrl, categoryId) {
    const data = {};
    if (customWord !== undefined) data.customWord = customWord;
    if (customImageUrl !== undefined) data.customImageUrl = customImageUrl;
    if (categoryId !== undefined && categoryId !== null) data.categoryId = categoryId;

    return await prisma.userWord.update({
      where: { id: userWordId },
      data,
      include: {
        userCategory: true
      }
    });
  }

  /**
   * 삭제용 UserWord 생성 (기본 낱말 참조, isDeleted=true)
   * @param {string} userId
   * @param {string} wordId - Word.id
   * @param {number} displayOrder
   * @returns {Promise<Object>}
   */
  async createUserWordForDelete(userId, wordId, displayOrder) {
    const word = await this.findWordById(wordId);
    
    return await prisma.userWord.create({
      data: {
        userId,
        wordId,
        categoryId: word.categoryId,
        partOfSpeech: word.partOfSpeech,
        displayOrder,
        isFavorite: false,
        isDeleted: true
      }
    });
  }

  /**
   * UserWord를 삭제 상태로 변경 (isDeleted=true)
   * @param {string} userWordId - UserWord.id
   * @returns {Promise<Object>}
   */
  async markUserWordAsDeleted(userWordId) {
    return await prisma.userWord.update({
      where: { id: userWordId },
      data: { isDeleted: true }
    });
  }

  /**
   * 카테고리의 모든 Word를 UserWord로 스냅샷 생성
   * 순서 변경을 위해 기본 낱말들을 UserWord로 래핑
   * @param {string} userId
   * @param {string} categoryId
   * @returns {Promise<Array>} 생성된 UserWord 목록
   */
  async createSnapshotFromWords(userId, categoryId) {
    // 1. 해당 카테고리의 모든 Word 조회
    const words = await this.findWords(categoryId, userId);

    // 2. categoryId가 UserCategory인지 확인
    const userCategory = await prisma.userCategory.findUnique({
      where: { id: categoryId }
    });
    const isUserCategory = !!userCategory;

    // 3. 각 Word를 UserWord로 복사 (wordId, categoryId 제거)
    const createPromises = words.map((word, index) =>
      prisma.userWord.create({
        data: {
          userId,
          userCategoryId: isUserCategory ? categoryId : null,
          partOfSpeech: word.partOfSpeech,
          customWord: word.word,
          customImageUrl: word.imageUrl,
          displayOrder: index,
          isFavorite: false,
          isDeleted: false
        }
      })
    );

    return await Promise.all(createPromises);
  }

  /**
   * 여러 UserWord의 displayOrder 일괄 업데이트
   * @param {Array<{userWordId: string, displayOrder: number}>} updates
   * @returns {Promise<void>}
   */
  async bulkUpdateDisplayOrders(updates) {
    const updatePromises = updates.map(({ userWordId, displayOrder }) =>
      prisma.userWord.update({
        where: { id: userWordId },
        data: { displayOrder }
      })
    );

    await Promise.all(updatePromises);
  }

  /**
   * 카테고리의 UserWord(wordId 참조하는 것) 개수 확인
   * @param {string} userId
   * @param {string} categoryId
   * @returns {Promise<number>}
   */
  async countUserWordReferences(userId, categoryId) {
    return await prisma.userWord.count({
      where: {
        userId,
        categoryId,
        wordId: { not: null }, // wordId가 있는 것만 (Word 참조)
        isDeleted: false
      }
    });
  }
}

export default new WordsRepository();
