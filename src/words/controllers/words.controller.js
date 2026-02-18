import wordsService from '../services/words.service.js';
import { GetWordsQueryDto, CreateWordDto, UpdateFavoriteDto, UpdateWordDto, ReorderWordsDto } from '../dto/words.dto.js';

/**
 * Words Controller
 */
export class WordsController {
  /**
   * GET /api/words - 낱말 카드 조회
   */
  async getWords(req, res, next) {
    try {
      const userId = req.user?.userId;
      const accountType = req.user?.accountType;

      const queryDto = new GetWordsQueryDto({
        categoryId: req.query.categoryId,
        onlyFavorite: req.query.onlyFavorite
      });

      const result = await wordsService.getWords(
        userId,
        accountType,
        queryDto.categoryId,
        queryDto.onlyFavorite
      );

      return res.success(result, '낱말 카드 목록 조회 성공');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/words - 개인 낱말 카드 추가
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

      return res.success({ word: createdWord }, '개인 낱말 카드 추가 성공', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/words/:cardId/favorite - 낱말 카드 즐겨찾기 변경
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
      return res.success(result, '낱말 카드 즐겨찾기 변경 성공');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/words/:cardId - 낱말 카드 수정
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

      return res.success({ word: updatedWord }, '낱말 카드 수정 성공');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/words/:cardId - 낱말 카드 삭제
   */
  async deleteWord(req, res, next) {
    try {
      const userId = req.user.userId;
      const { cardId } = req.params;

      await wordsService.deleteWord(userId, cardId);

      return res.success(null, '낱말 카드 삭제 성공');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/words/reorder - 낱말 카드 순서 변경
   */
  async reorderWords(req, res, next) {
    try {
      const userId = req.user.userId;
      const { categoryId, orderedCardIds } = req.body;

      const reorderedWords = await wordsService.reorderWords(
        userId,
        categoryId,
        orderedCardIds
      );

      return res.success({ words: reorderedWords }, '낱말 카드 순서 변경 성공');
    } catch (error) {
      next(error);
    }
  }
}

export default new WordsController();
