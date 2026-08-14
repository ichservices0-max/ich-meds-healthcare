const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 12);
  
  await prisma.doctor.upsert({
    where: { email: 'doctor@example.com' },
    update: { passwordHash: hash },
    create: {
      email: 'doctor@example.com',
      name: 'Dr. Test Specialist',
      phone: '0987654321',
      passwordHash: hash,
      registrationNumber: 'MED123456',
      qualification: 'MBBS, MD',
      degree: 'MD',
      experience: 10,
      specialty: 'Cardiology',
      clinicName: 'Test Clinic',
      clinicAddress: '123 Medical St',
      city: 'Testville',
      state: 'Test State',
      country: 'Test Country',
      fee: 150,
      verificationStatus: 'VERIFIED',
      lat: 0.0,
      lng: 0.0,
    },
  });
  
  console.log('Success! Test doctor created: doctor@example.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
