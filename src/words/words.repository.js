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
}

export default new WordsRepository();
