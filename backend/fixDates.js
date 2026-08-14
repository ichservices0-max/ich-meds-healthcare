const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const sessions = await prisma.doctorSession.findMany();
  for (const session of sessions) {
    // If the time is 18:30:00.000Z, we want it to be 00:00:00.000Z of the next day.
    // Easiest way: take the date, add 5.5 hours to get local, then set to UTC midnight of that local date.
    // Or simply, we just want to strip the time.
    
    // session.date is a Date object.
    const localDateStr = session.date.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
    // localDateStr is YYYY-MM-DD
    
    // Or even simpler:
    const fixedDate = new Date(session.date);
    fixedDate.setUTCHours(0,0,0,0);
    if (session.date.getUTCHours() > 12) {
      fixedDate.setUTCDate(fixedDate.getUTCDate() + 1);
    }
    
    await prisma.doctorSession.update({
      where: { id: session.id },
      data: { date: fixedDate }
    });
  }
  console.log("Fixed", sessions.length, "sessions.");
}
fix().finally(() => prisma.$disconnect());
