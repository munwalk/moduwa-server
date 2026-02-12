import wordsRepository from '../repositories/words.repository.js';
import { WordCardResponseDto } from '../dto/words.dto.js';
import { analyzeWord } from '../../utils/nlp.client.js';

/**
 * Words Service
 */
export class WordsService {
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
    const words = await wordsRepository.findWords(categoryId);
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
    const wordCards = [];
    let categoryName = null;

    // 카테고리 이름 조회 (categoryId가 있을 때만)
    if (categoryId) {
      const category = await wordsRepository.findCategoryById(categoryId);
      categoryName = category?.categoryName || null;
    }

    // userId가 있을 때만 사용자 낱말 조회
    let userWords = [];
    const userWordMap = new Map();
    const deletedWordIds = new Set();
    if (userId) {
      // 1. UserWord 조회 (개인화된 낱말) - includeDeleted=true로 삭제된 것도 포함
      userWords = await wordsRepository.findUserWords(userId, categoryId, onlyFavorite, true);
      
      // UserWord를 cardId 맵으로 저장 (wordId 기준)
      userWords.forEach(uw => {
        if (uw.wordId) {
          userWordMap.set(uw.wordId, uw);
        }
      });

      // isDeleted=true인 Word.id를 수집 (기본 낱말 필터링용)
      userWords.forEach(uw => {
        if (uw.wordId && uw.isDeleted) {
          deletedWordIds.add(uw.wordId);
        }
      });
    }

    // 2. 기본 낱말(Word) 먼저 조회 (UserWord가 없는 것만)
    if (!onlyFavorite) {
      const words = await wordsRepository.findWords(categoryId);

      words.forEach((word, index) => {
        // 이미 UserWord로 개인화된 낱말은 제외
        // isDeleted=true로 표시된 낱말도 제외
        if (!userWordMap.has(word.id) && !deletedWordIds.has(word.id)) {
          wordCards.push(new WordCardResponseDto({
            cardId: word.id, // Word.id
            categoryId: word.categoryId,
            categoryName: word.category?.categoryName,
            partOfSpeech: word.partOfSpeech,
            word: word.word,
            imageUrl: word.imageUrl,
            isDefault: true,
            isFavorite: false,
            displayOrder: index // 기본 낱말은 0, 1, 2...
          }));
        }
      });
    }

    // 3. UserWord를 WordCardResponseDto로 변환 (isDeleted=false인 것만)
    userWords.forEach(uw => {
      // isDeleted=true인 경우 제외
      if (uw.isDeleted) {
        return;
      }

      // 개인 낱말: customWord가 있으면 사용, 없으면 기본 낱말 참조
      const displayWord = uw.customWord || (uw.word?.word || '');
      const displayImageUrl = uw.customImageUrl || (uw.word?.imageUrl || '');
      
      // categoryId 결정: userCategoryId 우선, 없으면 categoryId
      const cardCategoryId = uw.userCategoryId || uw.categoryId;
      const cardCategoryName = uw.userCategory?.categoryName || uw.category?.categoryName;

      wordCards.push(new WordCardResponseDto({
        cardId: uw.id, // UserWord.id
        categoryId: cardCategoryId,
        categoryName: cardCategoryName,
        partOfSpeech: uw.partOfSpeech,
        word: displayWord,
        imageUrl: displayImageUrl,
        isDefault: uw.wordId !== null, // wordId가 있으면 기본 낱말 참조
        isFavorite: uw.isFavorite,
        displayOrder: uw.displayOrder // UserWord는 그대로 사용
      }));
    });

    // 4. displayOrder 기준 정렬
    wordCards.sort((a, b) => a.displayOrder - b.displayOrder);

    // categoryId가 있으면 category 정보 포함, 없으면 words만 반환
    if (categoryId) {
      return {
        category: categoryName,
        words: wordCards
      };
    } else {
      return {
        words: wordCards
      };
    }
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
    // 1. cardId가 UserWord인지 Word인지 확인
    let userWord = await wordsRepository.findUserWordById(cardId);
    
    if (userWord) {
      // UserWord가 존재하는 경우
      if (isFavorite) {
        // 즐겨찾기 설정: isFavorite 업데이트
        await wordsRepository.updateUserWordFavorite(cardId, true);
        return { cardId, isFavorite: true };
      } else {
        // 즐겨찾기 해제
        if (userWord.customWord || userWord.customImageUrl) {
          // customWord가 있으면: isFavorite만 false로 업데이트
          await wordsRepository.updateUserWordFavorite(cardId, false);
          return { cardId, isFavorite: false };
        } else {
          // customWord가 없으면(기본 낱말만 참조): UserWord 삭제, Word.id 반환
          const wordId = userWord.wordId;
          await wordsRepository.deleteUserWord(cardId);
          return { cardId: wordId, isFavorite: false };
        }
      }
    } else {
      // Word인 경우
      const word = await wordsRepository.findWordById(cardId);
      if (!word) {
        throw new Error('존재하지 않는 낱말입니다');
      }

      if (isFavorite) {
        // 즐겨찾기 설정: UserWord 생성
        const newDisplayOrder = await this.getNextDisplayOrder(userId, word.categoryId);

        const newUserWord = await wordsRepository.createUserWordForFavorite(
          userId,
          cardId,
          newDisplayOrder
        );
        return { cardId: newUserWord.id, isFavorite: true };
      } else {
        // 즐겨찾기 해제: Word는 기본적으로 즐겨찾기가 아니므로 아무것도 안함
        return { cardId, isFavorite: false };
      }
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
    // 1. cardId가 UserWord인지 Word인지 확인
    let userWord = await wordsRepository.findUserWordById(cardId);
    
    if (userWord) {
      // UserWord가 존재하는 경우: customWord/customImageUrl/categoryId 업데이트
      const updatedUserWord = await wordsRepository.updateUserWord(cardId, word, imageUrl, categoryId);
      
      const displayWord = updatedUserWord.customWord || (updatedUserWord.word?.word || '');
      const displayImageUrl = updatedUserWord.customImageUrl || (updatedUserWord.word?.imageUrl || '');
      
      return new WordCardResponseDto({
        cardId: updatedUserWord.id,
        categoryId: updatedUserWord.userCategoryId || updatedUserWord.categoryId,
        categoryName: updatedUserWord.userCategory?.categoryName || updatedUserWord.category?.categoryName,
        partOfSpeech: updatedUserWord.partOfSpeech,
        word: displayWord,
        imageUrl: displayImageUrl,
        isDefault: updatedUserWord.wordId !== null,
        isFavorite: updatedUserWord.isFavorite,
        displayOrder: updatedUserWord.displayOrder
      });
    } else {
      // Word인 경우: UserWord 생성
      const baseWord = await wordsRepository.findWordById(cardId);
      if (!baseWord) {
        throw new Error('존재하지 않는 낱말입니다');
      }

      // 카테고리 결정: categoryId 파라미터가 있으면 사용, 아니면 baseWord.categoryId
      const targetCategoryId = categoryId || baseWord.categoryId;

      // displayOrder 계산
      const newDisplayOrder = await this.getNextDisplayOrder(userId, targetCategoryId);

      const newUserWord = await wordsRepository.createUserWordForEdit(
        userId,
        cardId,
        word || null,
        imageUrl || null,
        newDisplayOrder,
        targetCategoryId
      );

      const displayWord = newUserWord.customWord || newUserWord.word.word;
      const displayImageUrl = newUserWord.customImageUrl || newUserWord.word.imageUrl;

      return new WordCardResponseDto({
        cardId: newUserWord.id,
        categoryId: newUserWord.categoryId,
        categoryName: newUserWord.category?.categoryName,
        partOfSpeech: newUserWord.partOfSpeech,
        word: displayWord,
        imageUrl: displayImageUrl,
        isDefault: true,
        isFavorite: newUserWord.isFavorite,
        displayOrder: newUserWord.displayOrder
      });
    }
  }

  /**
   * 낱말 카드 삭제(숨김) 처리
   * @param {string} userId
   * @param {string} cardId - Word.id 또는 UserWord.id
   * @returns {Promise<void>}
   */
  async deleteWord(userId, cardId) {
    // 1. cardId가 UserWord인지 확인
    let userWord = await wordsRepository.findUserWordById(cardId);
    
    if (userWord) {
      // UserWord인 경우: 실제 삭제 (DELETE)
      await wordsRepository.deleteUserWord(cardId);
    } else {
      // Word인 경우: UserWord 레이어 생성 후 isDeleted=true 처리
      const baseWord = await wordsRepository.findWordById(cardId);
      
      if (!baseWord) {
        throw new Error('존재하지 않는 낱말입니다');
      }

      // displayOrder 계산
      const newDisplayOrder = await this.getNextDisplayOrder(userId, baseWord.categoryId);

      // isDeleted=true로 UserWord 생성
      await wordsRepository.createUserWordForDelete(userId, cardId, newDisplayOrder);
    }
  }

  /**
   * 낱말 카드 순서 변경 (스냅샷 전략)
   * @param {string} userId
   * @param {string} categoryId
   * @param {Array<string>} orderedCardIds - 새로운 순서의 cardId 배열
   * @returns {Promise<Array>} 변경된 낱말 목록
   */
  async reorderWords(userId, categoryId, orderedCardIds) {
    // 1. orderedCardIds 중 UserWord인 것과 Word인 것을 구분
    const userWordIds = [];
    const baseWordIds = [];

    for (const cardId of orderedCardIds) {
      const userWord = await wordsRepository.findUserWordById(cardId);
      if (userWord) {
        userWordIds.push(cardId);
      } else {
        baseWordIds.push(cardId);
      }
    }

    // 2. 기본 Word 참조가 있으면 스냅샷 생성 (아직 생성되지 않은 것만)
    let createdUserWords = [];
    if (baseWordIds.length > 0) {
      const snapshotCount = await wordsRepository.countUserWordReferences(userId, categoryId);
      if (snapshotCount === 0) {
        // 스냅샷이 없으면 생성
        createdUserWords = await wordsRepository.createSnapshotFromWords(userId, categoryId);
      }
    }

    // 3. Word.id를 UserWord.id로 매핑 (스냅샷이 생성된 경우)
    const wordIdToUserWordIdMap = new Map();
    if (createdUserWords.length > 0) {
      createdUserWords.forEach(uw => {
        if (uw.wordId) {
          wordIdToUserWordIdMap.set(uw.wordId, uw.id);
        }
      });
    }

    // 4. orderedCardIds를 UserWord.id로 변환
    const finalOrderedCardIds = orderedCardIds.map(cardId => {
      // 이미 UserWord.id면 그대로, Word.id면 변환된 UserWord.id 사용
      return wordIdToUserWordIdMap.get(cardId) || cardId;
    });

    // 5. 업데이트할 displayOrder 목록 작성
    const updates = finalOrderedCardIds.map((userWordId, index) => {
      return { userWordId, displayOrder: index };
    });

    // 6. 대량 업데이트
    await wordsRepository.bulkUpdateDisplayOrders(updates);

    // 7. 변경된 낱말 목록 반환
    const reorderedWords = await this.getWords(userId, categoryId, false);
    return reorderedWords.words;
  }
}

export default new WordsService();
