import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding curated problems...');
  const jsonPath = path.resolve(__dirname, '../data/curated_problems.json');
  const fileData = fs.readFileSync(jsonPath, 'utf8');
  const problems = JSON.parse(fileData);

  let upsertedCount = 0;
  for (const prob of problems) {
    await prisma.curatedProblem.upsert({
      where: {
        platform_externalId: {
          platform: prob.platform,
          externalId: prob.externalId,
        },
      },
      update: {
        title: prob.title,
        url: prob.url,
        topic: prob.topic,
        difficultyTier: prob.difficultyTier,
        rating: prob.rating,
        tags: JSON.stringify(prob.tags || []),
        orderIndex: prob.orderIndex || 0,
        description: prob.description || null,
      },
      create: {
        platform: prob.platform,
        externalId: prob.externalId,
        title: prob.title,
        url: prob.url,
        topic: prob.topic,
        difficultyTier: prob.difficultyTier,
        rating: prob.rating,
        tags: JSON.stringify(prob.tags || []),
        orderIndex: prob.orderIndex || 0,
        description: prob.description || null,
      },
    });
    upsertedCount++;
  }

  console.log(`Successfully seeded ${upsertedCount} curated problems.`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
