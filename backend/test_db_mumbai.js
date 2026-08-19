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
  const directUrl = "postgresql://healthcare_app:HealthCare2026SecurePass123@db.cpjkzayzmeihmwaamkcx.supabase.co:5432/postgres";
  const poolerSession = "postgresql://healthcare_app.cpjkzayzmeihmwaamkcx:HealthCare2026SecurePass123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
  const poolerTx = "postgresql://healthcare_app.cpjkzayzmeihmwaamkcx:HealthCare2026SecurePass123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  
  await testConnection(directUrl, "Direct Connection (Mumbai)");
  await testConnection(poolerSession, "Pooler Session (Mumbai)");
  await testConnection(poolerTx, "Pooler Transaction (Mumbai)");
}

run();
