const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const docs = await prisma.doctor.findMany({ select: { name: true, email: true } });
  console.log("DOCTORS IN DATABASE:");
  console.log(docs);
}

check().finally(() => prisma.$disconnect());
