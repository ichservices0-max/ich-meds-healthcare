const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  await prisma.patient.upsert({
    where: { email: 'test@example.com' },
    update: { passwordHash: hash },
    create: {
      email: 'test@example.com',
      name: 'Test Patient',
      phone: '1234567890',
      passwordHash: hash,
    },
  });
  
  console.log('Success! Test patient created: test@example.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
