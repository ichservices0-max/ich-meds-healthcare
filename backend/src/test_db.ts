import { PrismaClient } from '@prisma/client';

async function test(url: string, label: string) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const count = await p.patient.count();
    console.log(`✅ [${label}] SUCCESS! Patients count:`, count);
    return true;
  } catch (err: any) {
    console.error(`❌ [${label}] FAILED:`, err.message.substring(0, 150));
    return false;
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  await test('postgresql://healthcare_app.umzmsvsardudkjpvdogx:HealthCare2026SecurePass123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true', 'Pooler-6543-hc');
  await test('postgresql://healthcare_app.umzmsvsardudkjpvdogx:HealthCare2026SecurePass123@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres', 'Pooler-5432-hc');
  await test('postgresql://healthcare_app:HealthCare2026SecurePass123@db.umzmsvsardudkjpvdogx.supabase.co:5432/postgres?connect_timeout=10', 'Direct-hc');
}

main();
