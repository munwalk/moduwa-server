import prisma from '../config/prisma.config.js';

// HIS-01: 사용자의 대화 이력 조회 (월별, 삭제되지 않은 항목)
export const findAllByUserId = async (userId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return await prisma.conversationHistory.findMany({
    where: {
      userId: userId,
      isDeleted: false,
      createdAt: { gte: startDate, lte: endDate }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      inputWords: true,
      selectedSentence: true,
      createdAt: true
    }
  });
};

// HIS-03: 특정 이력 존재 여부 확인
export const findById = async (historyId, userId) => {
  return await prisma.conversationHistory.findFirst({
    where: { id: historyId, userId: userId, isDeleted: false }
  });
};

// HIS-03: 특정 이력 삭제 (Soft Delete)
export const deleteById = async (historyId, userId) => {
  return await prisma.conversationHistory.update({
    where: { id: historyId },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};

// HIS-04: 특정 월의 모든 이력 삭제 (Soft Delete)
export const deleteAllByUserId = async (userId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return await prisma.conversationHistory.updateMany({
    where: {
      userId: userId,
      isDeleted: false,
      createdAt: { gte: startDate, lte: endDate }
    },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};

// HIS-05: 즐겨찾기(전체) + 최근 3개월 빈도순(80개) 병합 조회
export const findFrequentWords = async (userId, frequentLimit = 80) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // 1. 즐겨찾기 데이터 전체 조회 (개수 제한 없음)
  const favorites = await prisma.userWord.findMany({
    where: { userId, isFavorite: true, isDeleted: false },
    include: { userCategory: true }
  });

  // 2. 최근 3개월 대화 이력 조회
  const histories = await prisma.conversationHistory.findMany({
    where: {
      userId,
      isDeleted: false,
      inputWords: { not: prisma.DbNull },
      createdAt: { gte: threeMonthsAgo }
    },
    select: { inputWords: true, createdAt: true }
  });

  // 3. 빈도수 집계
  const wordFrequency = new Map();
  histories.forEach(history => {
    const words = typeof history.inputWords === 'string' ? JSON.parse(history.inputWords) : history.inputWords;
    if (Array.isArray(words)) {
      words.forEach(wordObj => {
        const key = wordObj.wordId || wordObj.word;
        if (wordFrequency.has(key)) {
          const existing = wordFrequency.get(key);
          existing.count += 1;
          existing.lastUsedAt = history.createdAt > existing.lastUsedAt ? history.createdAt : existing.lastUsedAt;
        } else {
          wordFrequency.set(key, { word: wordObj.word, wordId: wordObj.wordId, count: 1, lastUsedAt: history.createdAt });
        }
      });
    }
  });

  // 4. 빈도순 상위 80개 추출
  const topFrequentWords = Array.from(wordFrequency.values())
    .sort((a, b) => b.count - a.count || new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
    .slice(0, frequentLimit);

  // 5. 데이터 병합 (즐겨찾기 우선 + 빈도순 추가)
  const detailMap = new Map();

  // (1) 즐겨찾기 단어들을 먼저 Map에 담기 (isFavorite: true)
  favorites.forEach(fav => {
    const key = fav.customWord;
    detailMap.set(key, {
      wordId: null,
      word: fav.customWord,
      imageUrl: fav.customImageUrl,
      categoryId: fav.userCategory?.id || null,
      categoryName: fav.userCategory?.categoryName,
      isFavorite: true,
      usageCount: wordFrequency.get(key)?.count || 0,
      lastUsedAt: wordFrequency.get(key)?.lastUsedAt || null
    });
  });

  // (2) 빈도순 80개 중 즐겨찾기가 아닌 것들 추가 상세 조회
  const wordIds = topFrequentWords.filter(w => w.wordId).map(w => w.wordId);
  const wordTexts = topFrequentWords.filter(w => !w.wordId).map(w => w.word);

  const [dbWords, dbUserWords, dbWordsByText] = await Promise.all([
    prisma.word.findMany({ where: { id: { in: wordIds } }, include: { category: true } }),
    prisma.userWord.findMany({
      where: {
        userId,
        customWord: { in: wordTexts },
        isDeleted: false
      },
      include: { userCategory: true }
    }),
    prisma.word.findMany({ where: { word: { in: wordTexts } }, include: { category: true } })
  ]);

  // customWord 기반 UserWord 병합
  dbUserWords.forEach(uw => {
    const key = uw.customWord;
    if (!detailMap.has(key)) {
      detailMap.set(key, {
        wordId: null,
        word: uw.customWord,
        imageUrl: uw.customImageUrl,
        categoryId: uw.userCategory?.id || null,
        categoryName: uw.userCategory?.categoryName,
        isFavorite: uw.isFavorite,
        usageCount: wordFrequency.get(key)?.count || 0,
        lastUsedAt: wordFrequency.get(key)?.lastUsedAt || null
      });
    }
  });

  // wordId 기반 Word 병합 (기존 대화 이력에 wordId가 저장된 경우)
  dbWords.forEach(w => {
    if (!detailMap.has(w.id)) {
      detailMap.set(w.id, {
        wordId: w.id,
        word: w.word,
        imageUrl: w.imageUrl,
        categoryId: w.category?.id || null,
        categoryName: w.category?.categoryName,
        isFavorite: false,
        usageCount: wordFrequency.get(w.id)?.count || 0,
        lastUsedAt: wordFrequency.get(w.id)?.lastUsedAt || null
      });
    }
  });

  // 텍스트 기반 Word 병합
  dbWordsByText.forEach(w => {
    if (!detailMap.has(w.word)) {
      detailMap.set(w.word, {
        wordId: w.id,
        word: w.word,
        imageUrl: w.imageUrl,
        categoryId: w.category?.id || null,
        categoryName: w.category?.categoryName,
        isFavorite: false,
        usageCount: wordFrequency.get(w.word)?.count || 0,
        lastUsedAt: wordFrequency.get(w.word)?.lastUsedAt || null
      });
    }
  });

  // detailMap을 배열로 변환한 뒤, [즐겨찾기 여부 -> 빈도수 -> 최신 사용일] 순으로 최종 정렬
  return Array.from(detailMap.values()).sort((a, b) => {
    // 1순위: 즐겨찾기 여부 (true가 위로)
    if (a.isFavorite !== b.isFavorite) {
      return b.isFavorite ? 1 : -1;
    }
    // 2순위: 사용 빈도 (높은 순)
    if (a.usageCount !== b.usageCount) {
      return b.usageCount - a.usageCount;
    }
    // 3순위: 최근 사용 시간 (최신 순)
    return new Date(b.lastUsedAt) - new Date(a.lastUsedAt);
  });
};

// HIS-06: 최근 1주일 이내 사용한 낱말 조회 (시간순)
export const findRecentUsedWords = async (userId) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return await prisma.conversationHistory.findMany({
    where: {
      userId,
      isDeleted: false,
      inputWords: { not: prisma.DbNull },
      createdAt: { gte: oneWeekAgo }
    },
    select: { inputWords: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
};