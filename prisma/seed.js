import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 기존 약관 삭제
  await prisma.termsAgreement.deleteMany({});
  await prisma.terms.deleteMany({});

  // 낱말 및 이력 데이터 정리를 위해 추가 (FK 제약 고려)
  await prisma.conversationHistory.deleteMany({});
  await prisma.userWord.deleteMany({}); // 즐겨찾기 데이터 초기화
  await prisma.word.deleteMany({});
  await prisma.category.deleteMany({});

  // ==========================================
  // 약관 데이터 생성
  // ==========================================
  console.log("📜 약관 생성 중...");

  const terms = await prisma.terms.createMany({
    data: [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "서비스 이용약관 동의(필수)",
        content: `제1조 (목적)
본 약관은 '모두와 AAC'(이하 '서비스')가 제공하는 AI 기반 의사소통 보조 서비스 및 관련 제반 서비스의 이용과 관련하여, 서비스와 회원 간의 권리, 의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. 서비스: 회사가 구현한 AI 문장 추천, 낱말 카드 시스템, TTS 출력 등 의사소통 보조 소프트웨어를 의미합니다.
2. 회원: 본 약관에 동의하고 서비스를 이용하는 모든 사용자를 의미합니다.
3. 낱말 카드/키트: 사용자가 서비스를 통해 생성하거나 커뮤니티에서 다운로드한 의사소통 단어 집합을 의미합니다.
4. AI 학습 데이터: 사용자가 선택하거나 수정한 문장 정보를 통해 AI 모델의 정확도를 높이는 데 사용되는 비식별 데이터를 의미합니다.

제3조 (서비스의 제공 및 변경)
1. 서비스는 다음과 같은 기능을 제공합니다.
   • 낱말 카드를 활용한 문장 조합 및 TTS 출력
   • AI 기반 실시간 문장 추천 (AI-01, AI-05 등)
   • 개인 맞춤형 일과 루틴 관리
   • 외부 입력 장치(시선 추적기 등) 연동 지원
2. 서비스는 기술적 사양의 변경이나 AI 모델 고도화를 위해 서비스 내용을 변경할 수 있으며, 이 경우 앱 내 공지사항을 통해 사전 고지합니다.

제4조 (AI 문장 생성에 관한 특칙)
1. 생성 결과의 책임: AI가 생성한 추천 문장은 모델의 확률적 결과물이며, 사용자는 재생 전 해당 문장이 자신의 의도와 일치하는지 확인해야 합니다. 서비스는 AI 생성 문장으로 인해 발생한 오해나 사회적 갈등에 대해 직접적인 책임을 지지 않습니다.
2. 데이터 활용: 서비스는 문장 추천 품질 향상을 위해 사용자가 선택한 문장 데이터를 수집할 수 있습니다. 단, 모든 데이터는 특정 개인을 식별할 수 없는 형태로 비식별화하여 처리합니다.

제5조 (사용자의 의무)
1. 회원은 다음 행위를 해서는 안 됩니다.
   • 타인의 계정을 도용하거나 부정하게 사용하는 행위
   • 서비스의 AI 모델을 역설계(Reverse Engineering)하거나 부당하게 추출하려는 행위
   • 커뮤니티에 음란, 폭력, 비하적 내용이 담긴 낱말 키트를 공유하는 행위
2. 회원은 자신의 신체적 조건에 맞는 입력 장치(시선 추적기 등) 설정값과 안전 수칙을 준수해야 합니다.

제6조 (유료 서비스 및 환불)
1. 서비스는 일부 고급 기능(AI 무제한 추천, 데이터 클라우드 백업 등)을 유료 구독 형태로 제공할 수 있습니다.
2. 결제 및 환불은 각 앱 스토어(Google Play Store 등)의 정책 및 관련 법령을 따릅니다.

제7조 (서비스 중단 및 면책)
1. 서비스는 천재지변, 서버 점검, 네트워크 장애 등 불가항력적인 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있습니다.
2. 네트워크 의존성: AI 문장 추천 기능은 인터넷 연결이 필수적이며, 네트워크 환경에 따른 서비스 지연이나 불능에 대해 서비스는 책임을 지지 않습니다.

제8조 (개인정보 보호)
서비스는 회원의 개인정보를 보호하기 위해 관련 법령을 준수하며, 상세한 사항은 '개인정보 처리방침'에 따릅니다.`,
        version: "1.0",
        isRequired: true,
        isActive: true,
        order: 1,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        title: "개인정보 처리방침 동의(필수)",
        content: `제1조 (개인정보의 처리 목적)
'모두와 AAC'(이하 '서비스')는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
1. 회원 가입 및 관리: 회원 가입 의사 확인, 본인 식별·인증, 회원자격 유지·관리, 서비스 부정 이용 방지.
2. 서비스 제공 및 맞춤화: AI 문장 추천 알고리즘 고도화, 개인별 루틴 관리, TTS 목소리 설정 보존.
3. AI 모델 학습 및 개선: 사용자가 선택/수정한 문장의 비식별 처리를 통한 문장 생성 알고리즘의 품질 향상.

제2조 (처리하는 개인정보의 항목)
서비스는 이용자로부터 다음과 같은 개인정보를 수집합니다.
1. 필수 항목: 이메일 주소, 비밀번호, 닉네임, 로그 데이터, 기기 정보(OS 버전, 기기 모델명).
2. 선택 항목: 프로필 사진, TTS 목소리 선호도, 외부 입력 장치(시선 추적기 등) 설정값.
3. 서비스 이용 과정에서 생성되는 정보: 사용자가 선택한 낱말 조합, 최종 출력된 문장 데이터, 편집된 문장 이력.

제3조 (개인정보의 보유 및 이용 기간)
1. 서비스는 회원 탈퇴 시까지 개인정보를 보유 및 이용합니다.
2. 단, 관련 법령의 규정에 의하여 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관합니다.
3. 탈퇴한 회원의 데이터 중 비식별화된 문장 학습 데이터는 AI 모델의 일관성을 위해 파기하지 않고 통계적 목적으로 활용될 수 있습니다.

제4조 (개인정보의 제3자 제공)
서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
1. 이용자가 사전에 동의한 경우.
2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우.

제5조 (개인정보 처리의 위탁)
서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
   • Google Firebase / AWS: 데이터 보관 및 서버 운영 (클라우드 서비스)
   • OpenAI (API): 문장 생성 로직 처리를 위한 텍스트 데이터 전송 (단, 전송 시 개인 식별 정보는 모두 제거됨)

제6조 (민감정보의 처리 제한)
1. 서비스는 사용자의 건강 상태나 장애 등급 등 민감정보를 직접적으로 수집하지 않습니다.
2. 다만, AAC 서비스의 특성상 대화 내용에 건강 관련 내용이 포함될 수 있으며, 이는 전적으로 사용자의 의사에 따라 입력되는 데이터로 간주되어 철저히 암호화 관리됩니다.

제7조 (이용자의 권리와 행사 방법)
이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보 주체로서의 권리를 행사할 수 있습니다.`,
        version: "1.0",
        isRequired: true,
        isActive: true,
        order: 2,
      },
    ]
  });

  console.log(`✅ 약관 ${terms.count}개 생성 완료`);

  // ==========================================
  // 테스트용 사용자 생성
  // ==========================================
  console.log("👤 테스트 사용자 생성 중...");

  const TEST_USER_ID = "test-user-uuid-0001";

  const user = await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: { nickname: "테스트유저" },
    create: {
      id: TEST_USER_ID,
      nickname: "테스트유저",
      email: "test@moduwa.com",
      accountType: "SOCIAL",
    },
  });
  console.log(`✅ 테스트 사용자 설정 완료: ${user.nickname}`);

  /* =====================================================
     기본 카테고리 (category 테이블용)
     ⚠ userCategory에는 넣지 않음
  ===================================================== */

  console.log("📁 기본 카테고리 생성 중...");

  const defaultCategoryNames = [
    "최근사용",
    "즐겨찾기",
    "기본",
    "사람",
    "행동",
    "감정",
    "음식",
    "장소",
    "신체",
  ];

  const createdCategories = [];

  for (let i = 0; i < defaultCategoryNames.length; i++) {
    const category = await prisma.category.create({
      data: {
        categoryName: defaultCategoryNames[i],
        displayOrder: i,
        isDefault: true,
      },
    });

    createdCategories.push(category);
  }

  console.log("✅ 기본 카테고리 9개 생성 완료");

  // const categories = await Promise.all([
  //   prisma.category.create({ data: { categoryName: "인사", displayOrder: 1 } }),
  //   prisma.category.create({ data: { categoryName: "음식", displayOrder: 2 } }),
  //   prisma.category.create({ data: { categoryName: "장소", displayOrder: 3 } }),
  //   prisma.category.create({ data: { categoryName: "감정", displayOrder: 4 } }),
  // ]);

  // console.log(`✅ 카테고리 ${categories.length}개 생성 완료`);

  // ==========================================
  // 기본 낱말 데이터 (Word 테이블)
  // ==========================================
  console.log("📝 낱말 데이터 생성 중...");

  const wordData = [
    { word: "물", catIdx: 1, pos: "NOUN" },
    { word: "밥", catIdx: 1, pos: "NOUN" },
    { word: "사과", catIdx: 1, pos: "NOUN" },
    { word: "화장실", catIdx: 2, pos: "NOUN" },
    { word: "학교", catIdx: 2, pos: "NOUN" },
    { word: "집", catIdx: 2, pos: "NOUN" },
    { word: "안녕", catIdx: 0, pos: "NOUN" },
    { word: "도움", catIdx: 0, pos: "NOUN" },
    { word: "아프다", catIdx: 3, pos: "ADJECTIVE" },
    { word: "좋다", catIdx: 3, pos: "ADJECTIVE" },
    { word: "먹다", catIdx: 1, pos: "VERB" },
    { word: "가다", catIdx: 2, pos: "VERB" },
    { word: "주세요", catIdx: 0, pos: "VERB" },
    { word: "졸리다", catIdx: 3, pos: "ADJECTIVE" },
  ];

  const createdWords = [];
  for (const item of wordData) {
    const w = await prisma.word.create({
      data: {
        word: item.word,
        categoryId: createdCategories[item.catIdx].id,
        partOfSpeech: item.pos,
        imageUrl: `https://api.moduwa.com/images/${item.word}.png`,
        isDefault: true,
      },
    });
    createdWords.push(w);
  }

  console.log(`✅ 낱말 ${createdWords.length}개 생성 완료`);

  // ==========================================
  // 즐겨찾기(Favorites) 데이터 생성
  // ==========================================
  console.log("⭐️ 즐겨찾기 설정 중...");

  const favIndices = [0, 3, 6]; // '물', '화장실', '안녕'

  for (let i = 0; i < favIndices.length; i++) {
    const idx = favIndices[i];
    await prisma.userWord.create({
      data: {
        userId: user.id,
        wordId: createdWords[idx].id,
        categoryId: createdWords[idx].categoryId,
        isFavorite: true,
        isDeleted: false,
        partOfSpeech: createdWords[idx].partOfSpeech,
        displayOrder: i + 1,
      },
    });
  }

  console.log(`✅ 즐겨찾기 ${favIndices.length}개 생성 완료`);

  // ==========================================
  // 대화 이력 생성 (빈도수 테스트용)
  // ==========================================
  console.log("💬 대화 이력 생성 중...");

  for (let i = 0; i < createdWords.length; i++) {
    const targetWord = createdWords[i];
    const usageCount = 15 - i; // 상위 단어일수록 많이 사용 (최대 15회)

    for (let j = 0; j < usageCount; j++) {
      await prisma.conversationHistory.create({
        data: {
          userId: user.id,
          inputType: "WORD_ONLY",
          inputWords: [
            { wordId: targetWord.id, word: targetWord.word, order: 1 },
            { wordId: createdWords[12].id, word: "주세요", order: 2 },
          ],
          suggestedSentences: [`${targetWord.word} 주세요`],
          selectedSentence: `${targetWord.word} 주세요`,
          isOutputted: true,
          createdAt: new Date(new Date().getTime() - i * 60000),
        },
      });
    }
  }

  console.log(`✅ 대화 이력 생성 완료`);

  // ==========================================
  // 1주일 이상 지난 대화 이력 생성 (필터링 테스트용)
  // ==========================================
  console.log('📅 오래된 대화 이력 생성 중 (1주일 초과)...');

  const tenDaysAgo = new Date(new Date().getTime() - (10 * 24 * 60 * 60 * 1000)); // 10일 전
  const fifteenDaysAgo = new Date(new Date().getTime() - (15 * 24 * 60 * 60 * 1000)); // 15일 전

  // 10일 전 데이터 (이건 recent-words에서 제외되어야 함)
  // 최근 데이터에 없는 고유한 단어 사용
  await prisma.conversationHistory.create({
    data: {
      userId: user.id,
      inputType: 'WORD_ONLY',
      inputWords: [
        { wordId: null, word: '오래된단어1', order: 1 },
        { wordId: null, word: '테스트', order: 2 }
      ],
      suggestedSentences: ['오래된단어1 테스트'],
      selectedSentence: '오래된단어1 테스트',
      isOutputted: true,
      createdAt: tenDaysAgo
    }
  });

  // 15일 전 데이터 (이것도 recent-words에서 제외되어야 함)
  await prisma.conversationHistory.create({
    data: {
      userId: user.id,
      inputType: 'WORD_ONLY',
      inputWords: [
        { wordId: null, word: '오래된단어2', order: 1 },
        { wordId: null, word: '검증', order: 2 }
      ],
      suggestedSentences: ['오래된단어2 검증'],
      selectedSentence: '오래된단어2 검증',
      isOutputted: true,
      createdAt: fifteenDaysAgo
    }
  });

  console.log(`✅ 오래된 대화 이력 2개 생성 완료 (10일 전, 15일 전)`);

  console.log('\n🎉 All data seeded successfully!');
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
