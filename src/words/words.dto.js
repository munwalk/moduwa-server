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
