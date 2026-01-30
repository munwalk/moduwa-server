import * as favoriteRepository from '../repositories/favorite.repository.js';

/**
 * AI Favorite Service
 * AI-03: 즐겨찾기 문장 관리 비즈니스 로직
 */

/**
 * 즐겨찾기 추가
 */
const addFavorite = async (userId, sentence, sentenceSource) => {
  // 중복 체크
  const existing = await favoriteRepository.findDuplicateFavorite(userId, sentence);

  if (existing) {
    throw new Error('ALREADY_FAVORITED');
  }

  // 즐겨찾기 추가
  const favorite = await favoriteRepository.createFavorite({
    userId,
    sentence,
    sentenceSource
  });

  return favorite;
};

/**
 * 즐겨찾기 해제
 */
const removeFavorite = async (userId, favoriteId) => {
  // 즐겨찾기 조회
  const favorite = await favoriteRepository.findFavoriteById(favoriteId);

  if (!favorite) {
    throw new Error('FAVORITE_NOT_FOUND');
  }

  // 권한 확인 (본인의 즐겨찾기인지)
  if (favorite.userId !== userId) {
    throw new Error('FORBIDDEN');
  }

  // 삭제
  await favoriteRepository.deleteFavorite(favoriteId);

  return { success: true };
};

/**
 * 즐겨찾기 목록 조회
 */
const getFavorites = async (userId, options = {}) => {
  const favorites = await favoriteRepository.findFavoritesByUser(userId, options);
  const total = await favoriteRepository.countFavoritesByUser(userId);

  return {
    favorites,
    total,
    pagination: {
      limit: options.limit || total,
      offset: options.offset || 0
    }
  };
};

export {
  addFavorite,
  removeFavorite,
  getFavorites
};
