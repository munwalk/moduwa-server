import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 기존 약관 삭제
  await prisma.termsAgreement.deleteMany({});
  await prisma.terms.deleteMany({});

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
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });