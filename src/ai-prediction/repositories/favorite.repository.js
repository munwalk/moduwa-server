import prisma from '../../config/prisma.config.js';

/**
 * FavoriteSentence Repository
 * AI-03: 즐겨찾기 문장 관리
 */

/**
 * 즐겨찾기 추가
 */
const createFavorite = async (data) => {
  return await prisma.favoriteSentence.create({
    data
  });
};

/**
 * 즐겨찾기 목록 조회 (사용자별)
 */
const findFavoritesByUser = async (userId, options = {}) => {
  const { limit, offset, orderBy = 'desc' } = options;

  return await prisma.favoriteSentence.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: orderBy
    },
    take: limit,
    skip: offset
  });
};

/**
 * 특정 즐겨찾기 조회
 */
const findFavoriteById = async (favoriteId) => {
  return await prisma.favoriteSentence.findUnique({
    where: {
      id: favoriteId
    }
  });
};

/**
 * 즐겨찾기 삭제
 */
const deleteFavorite = async (favoriteId) => {
  return await prisma.favoriteSentence.delete({
    where: {
      id: favoriteId
    }
  });
};

/**
 * 중복 체크 (같은 문장이 이미 즐겨찾기에 있는지)
 */
const findDuplicateFavorite = async (userId, sentence) => {
  return await prisma.favoriteSentence.findFirst({
    where: {
      userId,
      sentence
    }
  });
};

/**
 * 즐겨찾기 개수 조회
 */
const countFavoritesByUser = async (userId) => {
  return await prisma.favoriteSentence.count({
    where: {
      userId
    }
  });
};

export {
  createFavorite,
  findFavoritesByUser,
  findFavoriteById,
  deleteFavorite,
  findDuplicateFavorite,
  countFavoritesByUser
};
