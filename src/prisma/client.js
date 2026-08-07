/**
 * Prisma Client Singleton
 *
 * Why a singleton?
 *   PrismaClient opens a connection pool. Instantiating it multiple times
 *   (e.g., inside a module that gets hot-reloaded in dev) will exhaust the
 *   Neon DB connection limit quickly.
 *
 * Why globalThis in development?
 *   Next.js / nodemon hot-reload clears the module cache but not globalThis.
 *   Storing the instance on globalThis prevents new pool creation on every reload.
 *
 * In production, there is no hot-reload so the singleton pattern is standard.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../common/logger/index.js';

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

  // Pipe Prisma events into Pino — keeps all logging in one place
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
    });
  }

  client.$on('error', (e) => {
    logger.error({ message: e.message }, 'Prisma error');
  });

  client.$on('warn', (e) => {
    logger.warn({ message: e.message }, 'Prisma warning');
  });

  return client;
};

// Persist instance across hot-reloads in development
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
