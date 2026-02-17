import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const s3BaseUrl = process.env.S3_BASE_URL;

const prisma = new PrismaClient();

async function main() {
  console.log("📝 기본 낱말 초기화 중...");

  // 기존 기본 낱말 삭제
  await prisma.word.deleteMany({
    where: { isDefault: true },
  });

  console.log("🗑️  기존 기본 낱말 삭제 완료\n");

  // JSON 파일 읽기
  const wordsJsonPath = join(__dirname, "seeds", "words.json");
  const wordsData = JSON.parse(readFileSync(wordsJsonPath, "utf-8"));

  let createdCount = 0;
  let errorCount = 0;

  for (const categoryData of wordsData) {
    console.log(`📁 카테고리: ${categoryData.categoryName}`);

    // 카테고리 찾기
    const category = await prisma.category.findFirst({
      where: {
        categoryName: categoryData.categoryName,
        isDefault: true,
      },
    });

    if (!category) {
      console.log(`  ⚠️  카테고리 "${categoryData.categoryName}"를 찾을 수 없습니다. 스킵합니다.`);
      errorCount += categoryData.words.length;
      continue;
    }

    // 각 낱말 처리
    for (const wordData of categoryData.words) {
      const createData = {
        word: wordData.word,
        categoryId: category.id,
        partOfSpeech: wordData.partOfSpeech || "NOUN", // 빈 문자열 처리
        // 환경변수와 상대경로 결합
        imageUrl: `${s3BaseUrl}/${wordData.imageUrl}`,
        isDefault: true,
      };

      // uuid가 있으면 id로 사용
      if (wordData.uuid) {
        createData.id = wordData.uuid;
      }

      await prisma.word.create({
        data: createData,
      });
      console.log(`  ✨ "${wordData.word}" 생성`);
      createdCount++;
    }
  }

  console.log(`\n✅ 완료: 생성 ${createdCount}개 / 오류 ${errorCount}개`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
