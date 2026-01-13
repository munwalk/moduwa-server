import wordsRepository from './words.repository.js';
import { WordCardResponseDto } from './words.dto.js';

/**
 * Words Service
 */
export class WordsService {
  /**
   * 낱말 카드 목록 조회
   * 기본 낱말(Word) + 개인 낱말(UserWord) 통합 반환
   * 
   * @param {string} userId
   * @param {string|null} categoryId - Category.id 또는 UserCategory.id
   * @param {boolean} onlyFavorite
   * @returns {Promise<Array<WordCardResponseDto>>}
   */
  async getWords(userId, categoryId = null, onlyFavorite = false) {
    const wordCards = [];

    // 1. UserWord 조회 (개인화된 낱말)
    const userWords = await wordsRepository.findUserWords(userId, categoryId, onlyFavorite);
    
    // UserWord를 cardId 맵으로 저장 (wordId 기준)
    const userWordMap = new Map();
    userWords.forEach(uw => {
      if (uw.wordId) {
        userWordMap.set(uw.wordId, uw);
      }
    });

    // 2. UserWord를 WordCardResponseDto로 변환
    userWords.forEach(uw => {
      // 개인 낱말: customWord가 있으면 사용, 없으면 기본 낱말 참조
      const displayWord = uw.customWord || (uw.word?.word || '');
      const displayImageUrl = uw.customImageUrl || (uw.word?.imageUrl || '');
      
      // categoryId 결정: userCategoryId 우선, 없으면 categoryId
      const cardCategoryId = uw.userCategoryId || uw.categoryId;

      wordCards.push(new WordCardResponseDto({
        cardId: uw.id, // UserWord.id
        categoryId: cardCategoryId,
        partOfSpeech: uw.partOfSpeech,
        word: displayWord,
        imageUrl: displayImageUrl,
        isDefault: uw.wordId !== null, // wordId가 있으면 기본 낱말 참조
        isFavorite: uw.isFavorite,
        displayOrder: uw.displayOrder
      }));
    });

    // 3. 기본 낱말(Word) 조회 (UserWord가 없는 것만)
    if (!onlyFavorite) {
      const words = await wordsRepository.findWords(categoryId);

      words.forEach(word => {
        // 이미 UserWord로 개인화된 낱말은 제외
        if (!userWordMap.has(word.id)) {
          wordCards.push(new WordCardResponseDto({
            cardId: word.id, // Word.id
            categoryId: word.categoryId,
            partOfSpeech: word.partOfSpeech,
            word: word.word,
            imageUrl: word.imageUrl,
            isDefault: true,
            isFavorite: false,
            displayOrder: 999 // 기본 낱말은 뒤로
          }));
        }
      });
    }

    // 4. displayOrder 기준 정렬
    wordCards.sort((a, b) => a.displayOrder - b.displayOrder);

    return wordCards;
  }

  /**
   * 사용자 개인 낱말 추가
   * @param {string} userId
   * @param {string} categoryId - Category.id 또는 UserCategory.id
   * @param {string} word - 낱말 텍스트
   * @param {string} imageUrl - 이미지 URL
   * @returns {Promise<WordCardResponseDto>}
   */
  async createWord(userId, categoryId, word, imageUrl) {
    // 현재 카테고리에서 최대 displayOrder 구하기
    const existingWords = await wordsRepository.findUserWords(userId, categoryId);
    const maxOrder = existingWords.length > 0 
      ? Math.max(...existingWords.map(w => w.displayOrder))
      : 0;
    
    const newDisplayOrder = maxOrder + 1;

    // UserWord 생성
    const createdUserWord = await wordsRepository.createUserWord(
      userId,
      categoryId,
      word,
      imageUrl,
      newDisplayOrder
    );

    return new WordCardResponseDto({
      cardId: createdUserWord.id,
      categoryId: createdUserWord.userCategoryId || createdUserWord.categoryId,
      partOfSpeech: createdUserWord.partOfSpeech,
      word: createdUserWord.customWord,
      imageUrl: createdUserWord.customImageUrl,
      isDefault: false,
      isFavorite: createdUserWord.isFavorite,
      displayOrder: createdUserWord.displayOrder
    });
  }
}

export default new WordsService();
