import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const dbUrl = process.env.DATABASE_URL || 'postgresql://healthcare_app:HealthCare2026SecurePass123@db.umzmsvsardudkjpvdogx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1';

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
