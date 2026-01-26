import wordsService from './words.service.js';
import { GetWordsQueryDto, CreateWordDto, UpdateFavoriteDto, UpdateWordDto } from './words.dto.js';

/**
 * Words Controller
 */
export class WordsController {
  /**
   * GET /api/in/words - 낱말 카드 조회
   */
  async getWords(req, res, next) {
    try {
      const userId = req.user?.userId;

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
      const userId = req.user.userId;

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

  /**
   * PATCH /api/pm/words/:cardId/favorite - 낱말 카드 즐겨찾기 변경
   */
  async updateFavorite(req, res, next) {
    try {
      const userId = req.user.userId;
      const { cardId } = req.params;

      const updateDto = new UpdateFavoriteDto({
        isFavorite: req.body.isFavorite
      });

      // 유효성 검증
      updateDto.validate();

      const result = await wordsService.updateFavorite(
        userId,
        cardId,
        updateDto.isFavorite
      );

      return res.status(200).json({
        success: true,
        data: { word: result },
        message: '낱말 카드 즐겨찾기 변경 성공'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/pm/words/:cardId - 낱말 카드 수정
   */
  async updateWord(req, res, next) {
    try {
      const userId = req.user.userId;
      const { cardId } = req.params;

      const updateDto = new UpdateWordDto({
        word: req.body.word,
        imageUrl: req.body.imageUrl,
        categoryId: req.body.categoryId
      });

      // 유효성 검증
      updateDto.validate();

      const updatedWord = await wordsService.updateWord(
        userId,
        cardId,
        updateDto.word,
        updateDto.imageUrl,
        updateDto.categoryId
      );

      return res.status(200).json({
        success: true,
        data: { word: updatedWord },
        message: '낱말 카드 수정 성공'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/pm/words/:cardId - 낱말 카드 삭제
   */
  async deleteWord(req, res, next) {
    try {
      const userId = req.user.userId;
      const { cardId } = req.params;

      await wordsService.deleteWord(userId, cardId);

      return res.status(200).json({
        success: true,
        data: null,
        message: '낱말 카드 삭제 성공'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WordsController();
