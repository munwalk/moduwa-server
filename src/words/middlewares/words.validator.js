import { GetWordsQueryDto, CreateWordDto, UpdateFavoriteDto, UpdateWordDto, ReorderWordsDto } from '../dto/words.dto.js';

/**
 * Words Validator Middleware
 */

/**
 * GET /api/words - Query 검증
 */
export const validateGetWordsQuery = (req, res, next) => {
  try {
    const queryDto = new GetWordsQueryDto({
      categoryId: req.query.categoryId,
      onlyFavorite: req.query.onlyFavorite
    });
    
    req.validatedQuery = queryDto;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/words - Request Body 검증
 */
export const validateCreateWordBody = (req, res, next) => {
  try {
    const createDto = new CreateWordDto({
      categoryId: req.body.categoryId,
      word: req.body.word,
      imageUrl: req.body.imageUrl
    });

    createDto.validate();
    req.validatedBody = createDto;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/words/:cardId/favorite - Request Body 검증
 */
export const validateUpdateFavoriteBody = (req, res, next) => {
  try {
    const updateDto = new UpdateFavoriteDto({
      isFavorite: req.body.isFavorite
    });

    updateDto.validate();
    req.validatedBody = updateDto;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/words/:cardId - Request Body 검증
 */
export const validateUpdateWordBody = (req, res, next) => {
  try {
    const updateDto = new UpdateWordDto({
      word: req.body.word,
      imageUrl: req.body.imageUrl,
      categoryId: req.body.categoryId
    });

    updateDto.validate();
    req.validatedBody = updateDto;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/words/reorder - Request Body 검증
 */
export const validateReorderWordsBody = (req, res, next) => {
  try {
    const reorderDto = new ReorderWordsDto({
      categoryId: req.body.categoryId,
      orderedCardIds: req.body.orderedCardIds
    });

    reorderDto.validate();
    req.validatedBody = reorderDto;
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  validateGetWordsQuery,
  validateCreateWordBody,
  validateUpdateFavoriteBody,
  validateUpdateWordBody,
  validateReorderWordsBody
};
