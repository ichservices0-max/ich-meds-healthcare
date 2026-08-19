const { PrismaClient } = require('@prisma/client');

async function testConnection(url, label) {
  console.log(`\nTesting: ${label}`);
  console.log(`URL: ${url.replace(/:[^:@]+@/, ':***@')}`);
  const client = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    const patient = await client.patient.findFirst();
    console.log(`SUCCESS! Found patient:`, patient ? patient.email : 'none');
  } catch (err) {
    console.error(`FAILED:`, err.message);
  } finally {
    await client.$disconnect();
  }
}

async function run() {
  const directUrl = "postgresql://healthcare_app:HealthCare2026SecurePass123@db.umzmsvsardudkjpvdogx.supabase.co:5432/postgres";
  const poolerSession = "postgresql://healthcare_app.umzmsvsardudkjpvdogx:HealthCare2026SecurePass123@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";
  const poolerTx = "postgresql://healthcare_app.umzmsvsardudkjpvdogx:HealthCare2026SecurePass123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
  
  await testConnection(directUrl, "Direct Connection");
  await testConnection(poolerSession, "Pooler (Port 5432 - Session)");
  await testConnection(poolerTx, "Pooler (Port 6543 - Transaction/PgBouncer)");
}

run();
