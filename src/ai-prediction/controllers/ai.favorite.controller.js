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

    return res.status(201).json({
      success: true,
      message: '즐겨찾기에 추가되었습니다',
      data: {
        id: favorite.id,
        sentence: favorite.sentence,
        sentenceSource: favorite.sentenceSource,
        createdAt: favorite.createdAt
      }
    });
  } catch (error) {
    if (error.message === 'ALREADY_FAVORITED') {
      return res.status(409).json({
        success: false,
        message: '이미 즐겨찾기에 추가된 문장입니다',
        error: { code: 'ALREADY_FAVORITED' }
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

    return res.status(200).json({
      success: true,
      message: '즐겨찾기에서 제거되었습니다',
      data: null
    });
  } catch (error) {
    if (error.message === 'FAVORITE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: '즐겨찾기를 찾을 수 없습니다',
        error: { code: 'FAVORITE_NOT_FOUND' }
      });
    }
    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({
        success: false,
        message: '권한이 없습니다',
        error: { code: 'FORBIDDEN' }
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

    return res.status(200).json({
      success: true,
      message: '즐겨찾기 목록 조회 성공',
      data: {
        favorites: result.favorites,
        total: result.total,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};
