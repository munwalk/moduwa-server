import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 기존 약관 삭제
  await prisma.termsAgreement.deleteMany({});
  await prisma.terms.deleteMany({});

  // 낱말 및 이력 데이터 정리를 위해 추가 (FK 제약 고려)
  await prisma.conversationHistory.deleteMany({});
  await prisma.userWord.deleteMany({}); // 즐겨찾기 데이터 초기화
  await prisma.word.deleteMany({});
  await prisma.category.deleteMany({});

  // 약관 데이터 생성
  const terms = await prisma.terms.createMany({
    data: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: '이용약관',
        content: `제1조 (목적)
본 약관은 마이토키(이하 "서비스")가 제공하는 AAC(보완대체 의사소통) 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 제공)
1. 회사는 다음과 같은 서비스를 제공합니다:
   - AAC 낱말 카드 서비스
   - AI 기반 문장 추천 서비스
   - TTS(음성 합성) 서비스
2. 서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다.`,
        version: '1.0',
        isRequired: true,
        isActive: true,
        order: 1
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: '개인정보 처리방침',
        content: `제1조 (개인정보의 수집 및 이용 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다.

1. 서비스 제공
   - AAC 서비스 제공
   - AI 기반 맞춤형 추천
   - 본인 확인 및 회원 관리

제2조 (수집하는 개인정보의 항목)
1. 필수 수집 항목
   - 소셜 로그인: 이메일, 닉네임, 프로필 정보`,
        version: '1.0',
        isRequired: true,
        isActive: true,
        order: 2
      }
    ]
  });

  console.log(' Terms seeded successfully!');
  console.log(` Created ${terms.count} terms`);

  /**
   * 테스트용 사용자 생성
   * [중요] 깃허브 업로드 시 개인정보 보호를 위해 범용 ID와 닉네임을 사용합니다.
   * 팀원들은 본인의 소셜 로그인 UUID로 테스트하고 싶을 경우 아래 ID를 수정하세요.
   */
  const TEST_USER_ID = 'test-user-uuid-0001'; 

  const user = await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: { nickname: '테스트유저' }, 
    create: {
      id: TEST_USER_ID,
      nickname: '테스트유저',
      email: 'test@moduwa.com',
      accountType: 'SOCIAL'
    }
  });
  console.log(`👤 테스트 사용자 설정 완료: ${user.nickname}`);

  // 카테고리 데이터 생성
  const categories = await Promise.all([
    prisma.category.create({ data: { categoryName: '인사', displayOrder: 1 } }),
    prisma.category.create({ data: { categoryName: '음식', displayOrder: 2 } }),
    prisma.category.create({ data: { categoryName: '장소', displayOrder: 3 } }),
    prisma.category.create({ data: { categoryName: '감정', displayOrder: 4 } })
  ]);

  // 기본 낱말 데이터 (Word 테이블)
  const wordData = [
    { word: '물', catIdx: 1, pos: 'NOUN' }, { word: '밥', catIdx: 1, pos: 'NOUN' },
    { word: '사과', catIdx: 1, pos: 'NOUN' }, { word: '화장실', catIdx: 2, pos: 'NOUN' },
    { word: '학교', catIdx: 2, pos: 'NOUN' }, { word: '집', catIdx: 2, pos: 'NOUN' },
    { word: '안녕', catIdx: 0, pos: 'NOUN' }, { word: '도움', catIdx: 0, pos: 'NOUN' },
    { word: '아프다', catIdx: 3, pos: 'ADJECTIVE' }, { word: '좋다', catIdx: 3, pos: 'ADJECTIVE' },
    { word: '먹다', catIdx: 1, pos: 'VERB' }, { word: '가다', catIdx: 2, pos: 'VERB' },
    { word: '주세요', catIdx: 0, pos: 'VERB' }, { word: '졸리다', catIdx: 3, pos: 'ADJECTIVE' }
  ];

  const createdWords = [];
  for (const item of wordData) {
    const w = await prisma.word.create({
      data: {
        word: item.word,
        categoryId: categories[item.catIdx].id,
        partOfSpeech: item.pos,
        imageUrl: `https://api.moduwa.com/images/${item.word}.png`,
        isDefault: true
      }
    });
    createdWords.push(w);
  }

  /**
   * 즐겨찾기(Favorites) 데이터 생성
   * '물', '화장실', '안녕'을 즐겨찾기로 등록
   */
  console.log('⭐️ 즐겨찾기 설정 중...');
  const favIndices = [0, 3, 6]; 
  
  // for...of 대신 for 루프나 entries()를 써서 순서(i)를 부여합니다.
  for (let i = 0; i < favIndices.length; i++) {
    const idx = favIndices[i];
    await prisma.userWord.create({
      data: {
        userId: user.id,
        wordId: createdWords[idx].id,
        isFavorite: true,
        isDeleted: false,
        partOfSpeech: createdWords[idx].partOfSpeech, // 이전 에러 해결
        displayOrder: i + 1 // 새로 발생한 에러 해결: 순차적으로 1, 2, 3 부여
      }
    });
  }

  /**
   * 모든 단어를 활용한 대화 이력 생성 (빈도순 테스트용)
   * 인덱스가 낮을수록 높은 빈도수를 갖도록 차등 생성
   */
  console.log('📊 빈도수 차등 적용 대화 이력 생성 중...');
  for (let i = 0; i < createdWords.length; i++) {
    const targetWord = createdWords[i];
    const usageCount = 15 - i; // 상위 단어일수록 많이 사용 (최대 15회)

    for (let j = 0; j < usageCount; j++) {
      await prisma.conversationHistory.create({
        data: {
          userId: user.id,
          inputType: 'WORD_ONLY',
          inputWords: [
            { wordId: targetWord.id, word: targetWord.word, order: 1 },
            { wordId: createdWords[12].id, word: '주세요', order: 2 } // '주세요' 고정
          ],
          suggestedSentences: [`${targetWord.word} 주세요`],
          selectedSentence: `${targetWord.word} 주세요`,
          isOutputted: true,
          createdAt: new Date(new Date().getTime() - (i * 60000)) // 최신성 부여
        }
      });
    }
  }

  console.log('✅ All data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });