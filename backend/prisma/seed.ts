import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns an array of 3 slots (morning / afternoon / evening) for the given
 * doctor on the given base date (a Date object whose time will be overridden).
 */
function buildSlots(
  doctorId: string,
  baseDate: Date,
): { doctorId: string; startTime: Date; endTime: Date }[] {
  const make = (hour: number) => {
    const start = new Date(baseDate);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(30);
    return { doctorId, startTime: start, endTime: end };
  };

  return [make(9), make(14), make(18)]; // 09:00, 14:00, 18:00
}

// ─────────────────────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱  Starting database seed …\n');

  // ── 1. Patient ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const patient = await prisma.patient.upsert({
    where: { email: 'patient@test.com' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'patient@test.com',
      phone: '+91-9876543210',
      passwordHash,
    },
  });

  console.log(`✅  Patient created: ${patient.name} (${patient.email})`);

  // ── 2. Doctors ────────────────────────────────────────────────────────────
  const doctorSeeds = [
    {
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@test.com',
      phone: '+91-9876543211',
      passwordHash,
      registrationNumber: 'MED-1001',
      qualification: 'MBBS, MD',
      degree: 'MD Cardiology',
      experience: 15,
      specialty: 'Cardiologist',
      clinicName: 'Heart Care Center',
      clinicAddress: '123 Health Ave',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lat: 19.076,
      lng: 72.8777,
      rating: 4.9,
      reviewCount: 127,
      fee: 500,
      verificationStatus: 'VERIFIED',
      isOnline: true,
      bio: '15+ years experience in cardiac care',
    },
    {
      name: 'Dr. Raj Patel',
      email: 'raj.patel@test.com',
      phone: '+91-9876543212',
      passwordHash,
      registrationNumber: 'MED-1002',
      qualification: 'MBBS',
      degree: 'General Medicine',
      experience: 12,
      specialty: 'General Physician',
      clinicName: 'Patel Clinic',
      clinicAddress: '456 Wellness Blvd',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lat: 19.0825,
      lng: 72.8905,
      rating: 4.7,
      reviewCount: 89,
      fee: 300,
      verificationStatus: 'VERIFIED',
      isOnline: false,
      bio: 'Trusted family physician with 12 years experience',
    },
    {
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@test.com',
      phone: '+91-9876543213',
      passwordHash,
      registrationNumber: 'MED-1003',
      qualification: 'MBBS, MD',
      degree: 'MD Dermatology',
      experience: 8,
      specialty: 'Dermatologist',
      clinicName: 'Skin Deep Care',
      clinicAddress: '789 Beauty St',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lat: 19.068,
      lng: 72.865,
      rating: 4.8,
      reviewCount: 103,
      fee: 400,
      verificationStatus: 'VERIFIED',
      isOnline: true,
      bio: 'Expert in skin care and cosmetic dermatology',
    },
  ];

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  for (const seed of doctorSeeds) {
    // Upsert doctor by name so re-runs are idempotent
    const doctor = await prisma.doctor.upsert({
      where: {
        // Prisma requires a unique field — we use a composite approach via a
        // findFirst then create/update pattern when there is no natural unique
        // key on name. To keep things clean we delete and recreate slots every
        // time but keep the doctor row stable via name-based lookup.
        id: (
          await prisma.doctor.findFirst({ where: { name: seed.name } })
        )?.id ?? '00000000-0000-0000-0000-000000000000',
      },
      update: { ...seed },
      create: { ...seed },
    });

    console.log(`✅  Doctor created: ${doctor.name} — ${doctor.specialty}`);

    // Delete stale slots before re-creating so re-runs stay clean
    await prisma.slot.deleteMany({ where: { doctorId: doctor.id, isBooked: false } });

    const slotData = [
      ...buildSlots(doctor.id, today),
      ...buildSlots(doctor.id, tomorrow),
    ];

    const { count } = await prisma.slot.createMany({ data: slotData });
    console.log(`   └─ ${count} slots created (today + tomorrow)`);
  }

  // ── 3. Summary ────────────────────────────────────────────────────────────
  console.log('\n🎉  Seed completed successfully!\n');
  console.log('─────────────────────────────────────────');
  console.log('Test credentials:');
  console.log('  Email   : patient@test.com');
  console.log('  Password: password123');
  console.log('─────────────────────────────────────────\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

main()
  .catch((error: unknown) => {
    console.error('❌  Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
