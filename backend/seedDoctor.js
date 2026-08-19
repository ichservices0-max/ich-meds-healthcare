const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const doctors = [
  {
    email: 'sarah.chen@test.com',
    name: 'Dr. Sarah Chen',
    phone: '9876543211',
    registrationNumber: 'MED-98765',
    qualification: 'MBBS, MD (Cardiology)',
    degree: 'MD',
    experience: 12,
    specialty: 'Cardiology',
    clinicName: 'ICH Heart & Vascular Center',
    clinicAddress: '42 Health Boulevard',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    fee: 120,
    rating: 4.9,
    reviewCount: 142,
    bio: 'Renowned cardiologist specializing in non-invasive cardiology, preventive heart care, and cardiac consultations.',
    verificationStatus: 'APPROVED',
    isOnline: true,
    lat: 19.0760,
    lng: 72.8777,
  },
  {
    email: 'james.wilson@test.com',
    name: 'Dr. James Wilson',
    phone: '9876543212',
    registrationNumber: 'MED-98766',
    qualification: 'MBBS, MS (Orthopedics)',
    degree: 'MS',
    experience: 15,
    specialty: 'Orthopedics',
    clinicName: 'City Joint & Bone Clinic',
    clinicAddress: '15 Medical Enclave',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    fee: 100,
    rating: 4.8,
    reviewCount: 98,
    bio: 'Orthopedic specialist focused on joint care, sports injuries, and rehabilitation therapy.',
    verificationStatus: 'APPROVED',
    isOnline: true,
    lat: 28.7041,
    lng: 77.1025,
  },
  {
    email: 'priya.sharma@test.com',
    name: 'Dr. Priya Sharma',
    phone: '9876543213',
    registrationNumber: 'MED-98767',
    qualification: 'MBBS, MD (Dermatology)',
    degree: 'MD',
    experience: 8,
    specialty: 'Dermatology',
    clinicName: 'Aura Skin & Aesthetic Care',
    clinicAddress: '88 Park Road',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    fee: 90,
    rating: 4.9,
    reviewCount: 215,
    bio: 'Expert dermatologist specializing in clinical dermatology, skin health, and aesthetic procedures.',
    verificationStatus: 'APPROVED',
    isOnline: true,
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    email: 'doctor@example.com',
    name: 'Dr. Test Specialist',
    phone: '0987654321',
    registrationNumber: 'MED123456',
    qualification: 'MBBS, MD',
    degree: 'MD',
    experience: 10,
    specialty: 'General Physician',
    clinicName: 'ICH Prime Clinic',
    clinicAddress: '123 Medical St',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    fee: 80,
    rating: 4.7,
    reviewCount: 64,
    verificationStatus: 'APPROVED',
    isOnline: true,
    lat: 19.0760,
    lng: 72.8777,
  }
];

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  for (const doc of doctors) {
    await prisma.doctor.upsert({
      where: { email: doc.email },
      update: { ...doc, passwordHash: hash },
      create: { ...doc, passwordHash: hash },
    });
  }
  
  console.log('Success! Doctors seeded into database:');
  doctors.forEach(d => console.log(` - ${d.name} (${d.specialty}): ${d.email} / password123`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
