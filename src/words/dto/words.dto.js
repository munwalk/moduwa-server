/**
 * Words DTO
 */

/**
 * PartOfSpeech Enum
 */
export const PartOfSpeech = {
  NOUN: 'NOUN',
  VERB: 'VERB',
  ADJECTIVE: 'ADJECTIVE',
  MODIFIER: 'MODIFIER',
  EMOTION: 'EMOTION',
  NONE: 'NONE'
};

/**
 * GET /api/words - Query DTO
 */
export class GetWordsQueryDto {
  constructor({ categoryId, onlyFavorite }) {
    this.categoryId = categoryId ? String(categoryId) : null; // String으로 변환
    this.onlyFavorite = onlyFavorite === 'true' || onlyFavorite === true;
  }
}

/**
 * POST /api/words - Create Word Request DTO
 */
export class CreateWordDto {
  constructor({ categoryId, word, imageUrl }) {
    this.categoryId = String(categoryId); // String으로 변환
    this.word = word;
    this.imageUrl = imageUrl;
  }

  validate() {
    const errors = [];
    
    if (!this.categoryId) {
      errors.push('categoryId는 필수입니다');
    }
    if (!this.word) {
      errors.push('word는 필수입니다');
    }
    // imageUrl은 선택사항

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}

/**
 * PATCH /api/words/:cardId/favorite - Update Favorite Request DTO
 */
export class UpdateFavoriteDto {
  constructor({ isFavorite }) {
    this.isFavorite = isFavorite;
  }

  validate() {
    if (typeof this.isFavorite !== 'boolean') {
      throw new Error('isFavorite는 boolean 타입이어야 합니다');
    }
  }
}

/**
 * PATCH /api/words/:cardId - Update Word Request DTO
 */
export class UpdateWordDto {
  constructor({ word, imageUrl, categoryId }) {
    this.word = word;
    this.imageUrl = imageUrl;
    this.categoryId = categoryId ? String(categoryId) : null;
  }

  validate() {
    if (!this.word && !this.imageUrl && !this.categoryId) {
      throw new Error('word, imageUrl, categoryId 중 하나는 필수입니다');
    }
  }
}

/**
 * PATCH /api/words/reorder - Reorder Words Request DTO
 */
export class ReorderWordsDto {
  constructor({ categoryId, orderedCardIds }) {
    this.categoryId = String(categoryId);
    this.orderedCardIds = orderedCardIds || [];
  }

  validate() {
    const errors = [];
    
    if (!this.categoryId) {
      errors.push('categoryId는 필수입니다');
    }
    if (!Array.isArray(this.orderedCardIds) || this.orderedCardIds.length === 0) {
      errors.push('orderedCardIds는 필수 배열입니다');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}

/**
 * 낱말 카드 응답 DTO
 */
export class WordCardResponseDto {
  constructor({
    cardId,
    categoryId,
    partOfSpeech,
    word,
    imageUrl,
    isDefault,
    isFavorite,
    displayOrder
  }) {
    this.cardId = cardId;
    this.categoryId = categoryId;
    this.partOfSpeech = partOfSpeech;
    this.word = word;
    this.imageUrl = imageUrl;
    this.isDefault = isDefault;
    this.isFavorite = isFavorite;
    this.displayOrder = displayOrder;
  }
}
