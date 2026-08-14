const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const hash = await bcrypt.hash('password123', 10);
  
  const doc = await prisma.doctor.findFirst();
  if (doc) {
    await prisma.doctor.update({ where: { id: doc.id }, data: { passwordHash: hash } });
    console.log('Doctor Email:', doc.email);
  }

  const pat = await prisma.patient.findFirst();
  if (pat) {
    await prisma.patient.update({ where: { id: pat.id }, data: { passwordHash: hash } });
    console.log('Patient Email:', pat.email);
  }
}

reset()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
