import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'owner@postgres.local' },
    update: { tenantId: 't1', status: 'active' },
    create: {
      email: 'owner@postgres.local',
      tenantId: 't1',
      status: 'active',
    },
  });

  console.log('PostgreSQL init completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
