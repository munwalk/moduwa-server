import wordsRepository from '../repositories/words.repository.js';
import { WordCardResponseDto } from '../dto/words.dto.js';
import { analyzeWord } from '../../utils/nlp.client.js';

/**
 * Words Service
 */
export class WordsService {
    /**
     * 내부용: 전체 낱말 카드 목록 생성 (categoryId 없이)
     */
    async _getAllWordCards(userId, onlyFavorite = false) {
      const wordCards = [];
      let categoryNameToUserCategoryIdMap = new Map();
      let categoryNameToCategoryIdMap = new Map();
      let hasUserCategories = false;

      if (userId) {
        const userCategories = await wordsRepository.findAllUserCategories(userId);
        if (userCategories.length > 0) {
          hasUserCategories = true;
          userCategories.forEach(uc => {
            categoryNameToUserCategoryIdMap.set(uc.categoryName, uc.id);
          });
        } else {
          const categories = await wordsRepository.findAllCategories();
          categories.forEach(c => {
            categoryNameToCategoryIdMap.set(c.categoryName, c.id);
          });
        }
      }

      // userWords 조회 (전체)
      let userWords = [];
      const userWordMap = new Map();
      const deletedWordIds = new Set();
      if (userId) {
        userWords = await wordsRepository.findUserWords(userId, null, onlyFavorite, true);
        userWords.forEach(uw => {
          if (uw.wordId) userWordMap.set(uw.wordId, uw);
        });
        userWords.forEach(uw => {
          if (uw.wordId && uw.isDeleted) deletedWordIds.add(uw.wordId);
        });
      }

      // 소셜 로그인(유저가 존재) 시에는 기본 Word를 반환하지 않고 UserWord만 반환
      // 게스트(유저 없음)일 때만 기본 Word 반환
      if (!onlyFavorite && !userId) {
        const words = await wordsRepository.findWords(null, userId);
        words.forEach((word, index) => {
          const wordCategoryName = word.category?.categoryName;
          let mappedCategoryId = categoryNameToCategoryIdMap.get(wordCategoryName) || word.categoryId;
          wordCards.push(new WordCardResponseDto({
            cardId: word.id,
            categoryId: mappedCategoryId,
            categoryName: wordCategoryName,
            partOfSpeech: word.partOfSpeech,
            word: word.word,
            imageUrl: word.imageUrl,
            isDefault: true,
            isFavorite: false,
            displayOrder: index
          }));
        });
      }

      // UserWord를 WordCardResponseDto로 변환 (isDeleted=false인 것만)
      userWords.forEach(uw => {
        if (uw.isDeleted) return;
        const displayWord = uw.customWord || (uw.word?.word || '');
        const displayImageUrl = uw.customImageUrl || (uw.word?.imageUrl || '');
        let cardCategoryId, cardCategoryName;
        if (uw.userCategoryId) {
          cardCategoryId = uw.userCategoryId;
          cardCategoryName = uw.userCategory?.categoryName;
        } else if (uw.categoryId) {
          cardCategoryName = uw.category?.categoryName;
          if (!hasUserCategories && cardCategoryName) {
            cardCategoryId = categoryNameToCategoryIdMap.get(cardCategoryName) || uw.categoryId;
          } else {
            cardCategoryId = uw.categoryId;
          }
        }
        wordCards.push(new WordCardResponseDto({
          cardId: uw.id,
          categoryId: cardCategoryId,
          categoryName: cardCategoryName,
          partOfSpeech: uw.partOfSpeech,
          word: displayWord,
          imageUrl: displayImageUrl,
          isDefault: uw.wordId !== null,
          isFavorite: uw.isFavorite,
          displayOrder: uw.displayOrder
        }));
      });

      wordCards.sort((a, b) => a.displayOrder - b.displayOrder);
      return wordCards;
    }
  /**
   * 다음 displayOrder 계산 (기본 Word + UserWord 모두 고려)
   * @param {string} userId
   * @param {string} categoryId
   * @returns {Promise<number>}
   */
  async getNextDisplayOrder(userId, categoryId) {
    // 1. UserWord 조회 (삭제된 것 제외)
    const userWords = await wordsRepository.findUserWords(userId, categoryId, false, false);
    
    // 2. UserWord가 있으면 최대값 + 1 반환
    if (userWords.length > 0) {
      const maxOrder = Math.max(...userWords.map(w => w.displayOrder));
      return maxOrder + 1;
    }
    
    // 3. UserWord가 없으면 기본 Word 개수 반환
    const words = await wordsRepository.findWords(categoryId, userId);
    return words.length;
  }

  /**
   * 낱말 카드 목록 조회
   * 기본 낱말(Word) + 개인 낱말(UserWord) 통합 반환
   * 
   * @param {string} userId
   * @param {string|null} categoryId - Category.id 또는 UserCategory.id
   * @param {boolean} onlyFavorite
   * @returns {Promise<Object>} { category, words }
   */
  async getWords(userId, categoryId = null, onlyFavorite = false) {
    // 1. 전체 낱말 목록 생성 (categoryId 없이)
    const allWords = await this._getAllWordCards(userId, onlyFavorite);

    // 2. categoryId가 없으면 전체 반환
    if (!categoryId) {
      return { words: allWords };
    }

    // 3. categoryId가 있으면 해당 카테고리만 필터링
    const filteredWords = allWords.filter(w => w.categoryId === categoryId);
    // 카테고리명 조회
    let categoryName = null;
    const category = await wordsRepository.findCategoryById(categoryId);
    if (category) {
      categoryName = category.categoryName;
    }
    return {
      category: categoryName,
      words: filteredWords
    };
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
    // 1. NLP 서비스로 품사 자동 분석
    const nlpResult = await analyzeWord(word);
    const partOfSpeech = nlpResult.category; // NOUN, VERB, ADJECTIVE 등

    console.log(`[NLP] 단어: ${word}, 품사: ${partOfSpeech} (원본: ${nlpResult.pos})`);

    // 2. 다음 displayOrder 계산
    const newDisplayOrder = await this.getNextDisplayOrder(userId, categoryId);

    // 3. UserWord 생성 (품사 포함)
    const createdUserWord = await wordsRepository.createUserWord(
      userId,
      categoryId,
      word,
      imageUrl,
      newDisplayOrder,
      partOfSpeech
    );

    // 4. 생성된 UserWord 다시 조회 (category 정보 포함)
    const userWordWithCategory = await wordsRepository.findUserWordById(createdUserWord.id);

    return new WordCardResponseDto({
      cardId: userWordWithCategory.id,
      categoryId: userWordWithCategory.userCategoryId || userWordWithCategory.categoryId,
      categoryName: userWordWithCategory.userCategory?.categoryName || userWordWithCategory.category?.categoryName,
      partOfSpeech: userWordWithCategory.partOfSpeech,
      word: userWordWithCategory.customWord,
      imageUrl: userWordWithCategory.customImageUrl,
      isDefault: false,
      isFavorite: userWordWithCategory.isFavorite,
      displayOrder: userWordWithCategory.displayOrder
    });
  }

  /**
   * 낱말 카드 즐겨찾기 상태 변경
   * @param {string} userId
   * @param {string} cardId - Word.id 또는 UserWord.id
   * @param {boolean} isFavorite
   * @returns {Promise<Object>} { cardId, isFavorite }
   */
  async updateFavorite(userId, cardId, isFavorite) {
    // 무조건 UserWord만 즐겨찾기/해제 가능: Word 기반 로직 제거
    const userWord = await wordsRepository.findUserWordById(cardId);
    if (!userWord) {
      throw new Error('존재하지 않는 UserWord입니다');
    }
    if (isFavorite) {
      await wordsRepository.updateUserWordFavorite(cardId, true);
      return { cardId, isFavorite: true };
    } else {
      await wordsRepository.updateUserWordFavorite(cardId, false);
      return { cardId, isFavorite: false };
    }
  }

  /**
   * 낱말 카드 수정
   * @param {string} userId
   * @param {string} cardId - Word.id 또는 UserWord.id
   * @param {string|undefined} word - 수정할 낱말 텍스트
   * @param {string|undefined} imageUrl - 수정할 이미지 URL
   * @param {string|undefined} categoryId - 변경할 카테고리 ID
   * @returns {Promise<WordCardResponseDto>}
   */
  async updateWord(userId, cardId, word, imageUrl, categoryId) {
    // 무조건 UserWord만 수정: 기본 Word 복사/생성 로직 제거
    const userWord = await wordsRepository.findUserWordById(cardId);
    if (!userWord) {
      throw new Error('존재하지 않는 UserWord입니다');
    }
    const updatedUserWord = await wordsRepository.updateUserWord(cardId, word, imageUrl, categoryId);
    return new WordCardResponseDto({
      cardId: updatedUserWord.id,
      categoryId: updatedUserWord.userCategoryId,
      categoryName: updatedUserWord.userCategory?.categoryName,
      partOfSpeech: updatedUserWord.partOfSpeech,
      word: updatedUserWord.customWord,
      imageUrl: updatedUserWord.customImageUrl,
      isDefault: false,
      isFavorite: updatedUserWord.isFavorite,
      displayOrder: updatedUserWord.displayOrder
    });
  }

  /**
   * 낱말 카드 삭제(숨김) 처리
   * @param {string} userId
   * @param {string} cardId - Word.id 또는 UserWord.id
   * @returns {Promise<void>}
   */
  async deleteWord(userId, cardId) {
    // 무조건 UserWord만 삭제: Word 기반 복사/숨김 로직 제거
    const userWord = await wordsRepository.findUserWordById(cardId);
    if (!userWord) {
      throw new Error('존재하지 않는 UserWord입니다');
    }
    await wordsRepository.deleteUserWord(cardId);
  }

  /**
   * 낱말 카드 순서 변경 (스냅샷 전략)
   * @param {string} userId
   * @param {string} categoryId
   * @param {Array<string>} orderedCardIds - 새로운 순서의 cardId 배열
   * @returns {Promise<Array>} 변경된 낱말 목록
   */
  async reorderWords(userId, categoryId, orderedCardIds) {
    // 무조건 UserWord만 순서변경: Word 기반 스냅샷/매핑 로직 제거
    const updates = orderedCardIds.map((userWordId, index) => ({ userWordId, displayOrder: index }));
    await wordsRepository.bulkUpdateDisplayOrders(updates);
    const reorderedWords = await this.getWords(userId, categoryId, false);
    return reorderedWords.words;
  }
}

export default new WordsService();
