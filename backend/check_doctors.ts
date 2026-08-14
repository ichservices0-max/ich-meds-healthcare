import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany({ select: { email: true, name: true } });
  console.log("Doctors:", doctors);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
