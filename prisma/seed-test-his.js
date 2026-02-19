/**
 * HIS-05 (오프라인 낱말) / HIS-06 (최근 사용 낱말) 테스트용 시드
 *
 * 사용법:
 *   컨테이너 내부:  node prisma/seed-test-his.js
 *   USER_ID 지정:  USER_ID=xxxx node prisma/seed-test-his.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── 0. 대상 유저 결정 ──────────────────────────────────
  let userId = process.env.USER_ID;

  if (!userId) {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!user) throw new Error('DB에 유저가 없습니다. 먼저 회원가입하세요.');
    userId = user.id;
  }

  console.log(`🎯 대상 유저 ID: ${userId}\n`);

  // ── 1. 기존 테스트 데이터 정리 ────────────────────────
  await prisma.conversationHistory.deleteMany({ where: { userId } });
  await prisma.userWord.deleteMany({ where: { userId } });
  await prisma.userCategory.deleteMany({ where: { userId } });
  console.log('🗑️  기존 데이터 삭제 완료');

  // ── 2. UserCategory 생성 ──────────────────────────────
  const category = await prisma.userCategory.create({
    data: {
      userId,
      categoryName: '일상',
      displayOrder: 1,
    },
  });
  console.log(`📁 카테고리 생성: ${category.categoryName}`);

  // ── 3. UserWord 생성 (isFavorite 포함) ────────────────
  const favoriteWords = ['밥', '물', '화장실', '좋아', '싫어'];
  const normalWords = ['학교', '집', '엄마', '아빠', '친구', '선생님', '버스'];

  let order = 1;

  for (const word of favoriteWords) {
    await prisma.userWord.create({
      data: {
        userId,
        userCategoryId: category.id,
        partOfSpeech: 'NOUN',
        customWord: word,
        displayOrder: order++,
        isFavorite: true,
        isDeleted: false,
      },
    });
  }

  for (const word of normalWords) {
    await prisma.userWord.create({
      data: {
        userId,
        userCategoryId: category.id,
        partOfSpeech: 'NOUN',
        customWord: word,
        displayOrder: order++,
        isFavorite: false,
        isDeleted: false,
      },
    });
  }

  console.log(`✨ UserWord 생성: 즐겨찾기 ${favoriteWords.length}개, 일반 ${normalWords.length}개`);

  // ── 4. ConversationHistory 생성 ───────────────────────
  const now = new Date();

  const daysAgo = (d) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date;
  };

  // inputWords 형식: [{word, order}]
  const makeInputWords = (...words) =>
    words.map((w, i) => ({ word: w, order: i }));

  const histories = [
    // 최근 1주일 이내 (HIS-06 recent-words)
    { days: 0, words: ['밥', '먹다'], sentence: '밥 먹을게요.' },
    { days: 1, words: ['물', '주다'], sentence: '물 주세요.' },
    { days: 2, words: ['화장실', '가다'], sentence: '화장실 가고 싶어요.' },
    { days: 3, words: ['좋아', '이거'], sentence: '이거 좋아요.' },
    { days: 4, words: ['엄마', '보고싶다'], sentence: '엄마 보고 싶어요.' },
    { days: 5, words: ['밥', '주다'], sentence: '밥 주세요.' },
    { days: 6, words: ['집', '가다'], sentence: '집에 가고 싶어요.' },

    // 최근 3개월 이내 (HIS-05 offline-words 빈도 계산용)
    { days: 10, words: ['밥', '먹다'], sentence: '밥 먹었어요.' },
    { days: 15, words: ['밥', '주다'], sentence: '밥 주세요.' },
    { days: 20, words: ['물', '마시다'], sentence: '물 마실게요.' },
    { days: 25, words: ['화장실', '급하다'], sentence: '화장실이 급해요.' },
    { days: 30, words: ['학교', '가다'], sentence: '학교 가요.' },
    { days: 40, words: ['친구', '만나다'], sentence: '친구 만나요.' },
    { days: 50, words: ['밥', '싫어'], sentence: '밥 싫어요.' },
    { days: 60, words: ['선생님', '안녕'], sentence: '선생님 안녕하세요.' },
    { days: 70, words: ['버스', '타다'], sentence: '버스 타요.' },
    { days: 80, words: ['물', '주다'], sentence: '물 주세요.' },
  ];

  for (const h of histories) {
    await prisma.conversationHistory.create({
      data: {
        userId,
        inputWords: makeInputWords(...h.words),
        inputType: 'WORD_ONLY',
        suggestedSentences: [h.sentence],
        selectedSentence: h.sentence,
        isOutputted: true,
        isDeleted: false,
        createdAt: daysAgo(h.days),
      },
    });
  }

  console.log(`📝 ConversationHistory 생성: ${histories.length}개`);
  console.log('\n✅ 시드 완료!');
  console.log('\n테스트:');
  console.log('  HIS-05 → GET /api/histories/offline-words?limit=30');
  console.log('  HIS-06 → GET /api/histories/recent-words');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
