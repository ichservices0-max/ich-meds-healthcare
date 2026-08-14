import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.slot.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.patient.deleteMany({});
  console.log('Cleared all data');
}
main().catch(console.error).finally(() => prisma.$disconnect());
