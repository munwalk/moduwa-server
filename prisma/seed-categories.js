import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📁 기본 카테고리 초기화 중...");

  // 기존 기본 카테고리 삭제
  await prisma.category.deleteMany({
    where: { isDefault: true },
  });

  console.log("🗑️  기존 기본 카테고리 삭제 완료\n");

  const defaultCategoryNames = [
    "최근사용",
    "즐겨찾기",
    "어미",
    "기본",
    "사람",
    "행동",
    "감정",
    "음식",
    "장소",
    "신체",
  ];

  for (let i = 0; i < defaultCategoryNames.length; i++) {
    const categoryName = defaultCategoryNames[i];

    await prisma.category.create({
      data: {
        categoryName: categoryName,
        displayOrder: i,
        isDefault: true,
      },
    });
    console.log(`  ✨ "${categoryName}" 카테고리 생성`);
  }

  console.log(`\n✅ 카테고리 ${defaultCategoryNames.length}개 생성 완료`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
