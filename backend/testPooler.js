const { PrismaClient } = require('@prisma/client');

async function test() {
  const url = 'postgresql://healthcare_app.cpjkzayzmeihmwaamkcx:HealthCare2026SecurePass123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });
  try {
    const count = await prisma.patient.count();
    console.log('SUCCESS CONNECTING TO POOLER! Patient count:', count);
  } catch (e) {
    console.error('FAIL:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
