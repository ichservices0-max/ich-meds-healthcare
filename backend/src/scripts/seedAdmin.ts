import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@healthcare.com';
  const password = 'AdminPassword123!';
  const name = 'Super Admin';

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) {
    console.log('Admin already exists');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await prisma.admin.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  console.log('Admin created successfully:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
