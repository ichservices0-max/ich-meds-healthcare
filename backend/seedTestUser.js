const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  await prisma.patient.upsert({
    where: { email: 'patient@test.com' },
    update: { passwordHash: hash },
    create: {
      email: 'patient@test.com',
      name: 'Alex Johnson',
      phone: '9876543210',
      passwordHash: hash,
    },
  });

  await prisma.doctor.upsert({
    where: { email: 'sarah.chen@test.com' },
    update: { passwordHash: hash, verificationStatus: 'APPROVED' },
    create: {
      email: 'sarah.chen@test.com',
      name: 'Dr. Sarah Chen',
      specialty: 'Cardiologist',
      phone: '9876543211',
      registrationNumber: 'MED-98765',
      qualification: 'MD, FACC - Cardiology',
      experience: 12,
      fee: 120,
      city: 'Mumbai',
      bio: 'Board-certified cardiologist with 12+ years of experience in clinical cardiology.',
      verificationStatus: 'APPROVED',
      isAvailable: true,
      passwordHash: hash,
    },
  });
  
  console.log('Success! Demo accounts ready:');
  console.log('Patient: patient@test.com / password123');
  console.log('Doctor: sarah.chen@test.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
