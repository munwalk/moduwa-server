import * as favoriteService from '../services/ai.favorite.service.js';

/**
 * AI Favorite Controller
 * AI-03: 즐겨찾기 문장 관리
 */

/**
 * 즐겨찾기 추가
 * POST /api/ai/favorites
 */
export const addFavoriteController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { sentence, sentenceSource } = req.body;

    const favorite = await favoriteService.addFavorite(userId, sentence, sentenceSource);

    return res.status(201).success(
      {
        id: favorite.id,
        sentence: favorite.sentence,
        sentenceSource: favorite.sentenceSource,
        createdAt: favorite.createdAt
      },
      '즐겨찾기에 추가되었습니다'
    );
  } catch (error) {
    if (error.message === 'ALREADY_FAVORITED') {
      return res.status(409).error({
        code: 'ALREADY_FAVORITED',
        message: '이미 즐겨찾기에 추가된 문장입니다'
      });
    }
    next(error);
  }
};

/**
 * 즐겨찾기 해제
 * DELETE /api/ai/favorites/:favoriteId
 */
export const removeFavoriteController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { favoriteId } = req.params;

    await favoriteService.removeFavorite(userId, favoriteId);

    return res.status(200).success(null, '즐겨찾기에서 제거되었습니다');
  } catch (error) {
    if (error.message === 'FAVORITE_NOT_FOUND') {
      return res.status(404).error({
        code: 'FAVORITE_NOT_FOUND',
        message: '즐겨찾기를 찾을 수 없습니다'
      });
    }
    if (error.message === 'FORBIDDEN') {
      return res.status(403).error({
        code: 'FORBIDDEN',
        message: '권한이 없습니다'
      });
    }
    next(error);
  }
};

/**
 * 즐겨찾기 목록 조회
 * GET /api/ai/favorites
 */
export const getFavoritesController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { limit, offset } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : 0
    };

    const result = await favoriteService.getFavorites(userId, options);

    return res.status(200).success(
      {
        favorites: result.favorites,
        total: result.total,
        pagination: result.pagination
      },
      '즐겨찾기 목록 조회 성공'
    );
  } catch (error) {
    next(error);
  }
};
