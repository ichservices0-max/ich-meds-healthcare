const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://healthcare_app:HealthCare2026SecurePass123@db.umzmsvsardudkjpvdogx.supabase.co:5432/postgres'
    }
  }
});

async function main() {
  const hash = await bcrypt.hash('AdminPassword123!', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@healthcare.com' },
    update: {},
    create: {
      email: 'admin@healthcare.com',
      name: 'Super Admin',
      passwordHash: hash,
    },
  });
  console.log('ADMIN_READY:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
