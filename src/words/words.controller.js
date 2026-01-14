import wordsService from './words.service.js';
import { GetWordsQueryDto, CreateWordDto } from './words.dto.js';

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

      const result = await wordsService.getWords(
        userId,
        queryDto.categoryId,
        queryDto.onlyFavorite
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: '낱말 카드 목록 조회 성공'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pm/words - 개인 낱말 카드 추가
   */
  async createWord(req, res, next) {
    try {
      const userId = req.user?.id || 'temp-user-id';

      const createDto = new CreateWordDto({
        categoryId: req.body.categoryId,
        word: req.body.word,
        imageUrl: req.body.imageUrl
      });

      // 유효성 검증
      createDto.validate();

      const createdWord = await wordsService.createWord(
        userId,
        createDto.categoryId,
        createDto.word,
        createDto.imageUrl
      );

      return res.status(201).json({
        success: true,
        data: { word: createdWord },
        message: '개인 낱말 카드 추가 성공'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WordsController();
