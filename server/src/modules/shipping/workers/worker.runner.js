/**
 * Standalone Logistics Outbox Worker Runner
 *
 * Can be executed as an independent microservice/daemon process:
 *   node src/modules/shipping/workers/worker.runner.js
 */

import { OutboxWorker } from './outbox.worker.js';
import { prisma } from '../../../prisma/client.js';
import { logger } from '../../../common/logger/index.js';

const worker = new OutboxWorker({
  workerId: `standalone-worker-${process.pid}`,
});

async function main() {
  logger.info('Starting Standalone Logistics Outbox Worker...');

  await prisma.$connect();

  const isRunOnce = process.argv.includes('--run-once');
  if (isRunOnce) {
    logger.info('Executing single outbox processing batch (--run-once)...');
    const processed = await worker.processBatch();
    logger.info({ processed }, 'Single batch completed.');
    await prisma.$disconnect();
    process.exit(0);
  }

  worker.start();

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Worker runner received shutdown signal...');
    await worker.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Worker runner failed to initialize');
  process.exit(1);
});
