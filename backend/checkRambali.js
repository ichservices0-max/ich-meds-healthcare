const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const dr = await prisma.doctor.findFirst({ where: { name: { contains: 'rambali' } } });
  if (!dr) {
    console.log("No Dr. rambali found!");
    return;
  }
  console.log("Found Dr:", dr.name, dr.id);

  const sessions = await prisma.doctorSession.findMany({ where: { doctorId: dr.id } });
  console.log("Sessions:", sessions);
}

check().finally(() => prisma.$disconnect());
