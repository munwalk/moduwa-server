import * as favoriteService from '../services/ai.favorite.service.js';
import {
  AlreadyFavoritedError,
  FavoriteNotFoundError,
  ForbiddenError
} from '../../errors/app.error.js';

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
      return next(new AlreadyFavoritedError());
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
      return next(new FavoriteNotFoundError());
    }
    if (error.message === 'FORBIDDEN') {
      return next(new ForbiddenError());
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
