import wordsService from './words.service.js';
import { GetWordsQueryDto } from './words.dto.js';

/**
 * Words Controller
 */
export class WordsController {
  /**
   * GET /api/in/words - 낱말 카드 조회
   */
  async getWords(req, res, next) {
    try {
      const userId = req.user?.id || 'temp-user-id';

      const queryDto = new GetWordsQueryDto({
        categoryId: req.query.categoryId,
        onlyFavorite: req.query.onlyFavorite
      });

      const words = await wordsService.getWords(
        userId,
        queryDto.categoryId,
        queryDto.onlyFavorite
      );

      return res.status(200).json({
        success: true,
        data: { words },
        message: '낱말 카드 목록 조회 성공'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WordsController();
