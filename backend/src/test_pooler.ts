import { PrismaClient } from '@prisma/client';

async function test(url: string, label: string) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const count = await p.patient.count();
    console.log(`✅ [${label}] SUCCESS! Patients count:`, count);
    return true;
  } catch (err: any) {
    console.error(`❌ [${label}] FAILED:`, err.message);
    return false;
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  const passwords = ['HealthCare2026SecurePass123', 'HealthCare2026SecurePass123@'];
  for (const pw of passwords) {
    await test(`postgresql://postgres.umzmsvsardudkjpvdogx:${encodeURIComponent(pw)}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`, `Session-5432-${pw}`);
    await test(`postgresql://postgres.umzmsvsardudkjpvdogx:${encodeURIComponent(pw)}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`, `Tx-6543-${pw}`);
  }
}

main();
