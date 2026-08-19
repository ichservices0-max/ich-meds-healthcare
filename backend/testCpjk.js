const { PrismaClient } = require('@prisma/client');

async function test() {
  const url = 'postgresql://healthcare_app:HealthCare2026SecurePass123@db.cpjkzayzmeihmwaamkcx.supabase.co:5432/postgres';
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });
  try {
    const count = await prisma.patient.count();
    console.log('CPJKZAYZ DIRECT SUCCESS! Patient count:', count);
  } catch (e) {
    console.error('FAIL:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
