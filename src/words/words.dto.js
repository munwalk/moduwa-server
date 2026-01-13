/**
 * Words DTO
 */

/**
 * GET /api/in/words - Query DTO
 */
export class GetWordsQueryDto {
  constructor({ categoryId, onlyFavorite }) {
    this.categoryId = categoryId || null;
    this.onlyFavorite = onlyFavorite === 'true' || onlyFavorite === true;
  }
}

/**
 * POST /api/pm/words - Create Word Request DTO
 */
export class CreateWordDto {
  constructor({ categoryId, word, imageUrl }) {
    this.categoryId = categoryId;
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
    if (!this.imageUrl) {
      errors.push('imageUrl은 필수입니다');
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
