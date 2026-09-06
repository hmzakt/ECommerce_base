import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'Admin';
const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'User';
const role = process.env.ADMIN_ROLE?.trim() || Role.SUPER_ADMIN;

if (!email || !password) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this command.');
}

if (!Object.values(Role).includes(role) || role === Role.CUSTOMER) {
  throw new Error('ADMIN_ROLE must be ADMIN or SUPER_ADMIN.');
}

if (password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
}

const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

try {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role,
          passwordHash,
          firstName,
          lastName,
          isActive: true,
          isEmailVerified: true,
        },
      })
    : await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          isActive: true,
          isEmailVerified: true,
        },
      });

  console.log(`${existingUser ? 'Updated' : 'Created'} ${user.role} account: ${user.email}`);
} finally {
  await prisma.$disconnect();
}