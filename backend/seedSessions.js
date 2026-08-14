const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany();
  if (doctors.length === 0) {
    console.log("No doctors found in the database.");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let createdCount = 0;

  for (const doctor of doctors) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Check if session already exists
      const existing = await prisma.doctorSession.findFirst({
        where: {
          doctorId: doctor.id,
          date: date,
        }
      });

      if (!existing) {
        // Create Morning Session
        await prisma.doctorSession.create({
          data: {
            doctorId: doctor.id,
            date: date,
            sessionType: 'MORNING',
            startTime: '10:00 AM',
            endTime: '01:00 PM',
            maxTokens: 20,
            currentToken: 0
          }
        });
        
        // Create Evening Session
        await prisma.doctorSession.create({
          data: {
            doctorId: doctor.id,
            date: date,
            sessionType: 'EVENING',
            startTime: '05:00 PM',
            endTime: '08:00 PM',
            maxTokens: 20,
            currentToken: 0
          }
        });
        createdCount += 2;
      }
    }
  }

  console.log(`Successfully created ${createdCount} sessions for all doctors for the next 7 days!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
