const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const result = await p.doctor.updateMany({
    data: { membershipStatus: 'ACTIVE' }
  });
  console.log('Updated', result.count, 'doctors to ACTIVE');
  await p.$disconnect();
}

main().catch(e => { console.error(e); p.$disconnect(); });
