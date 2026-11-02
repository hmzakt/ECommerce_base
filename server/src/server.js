/**
 * HTTP Server Entry Point
 *
 *
 * Why graceful shutdown?
 *   In Kubernetes/Docker environments, the orchestrator sends SIGTERM before
 *   killing a pod. Without handling it, in-flight requests are abruptly
 *   terminated, causing errors for users. A graceful shutdown ensures all
 *   ongoing requests complete before the process exits.
 */

import { createApp } from './app.js';
import { prisma } from './prisma/client.js';
import { logger } from './common/logger/index.js';
import { config } from './config/index.js';
import { shippingOutboxWorker } from './modules/shipping/workers/outbox.worker.js';

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 10_000; // 10 seconds

const startServer = async () => {
  // ── 1. Verify database connectivity ──────────────────────────────────────────
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to connect to database. Aborting startup.');
    process.exit(1);
  }

  // ── 2. Create app and start HTTP server ──────────────────────────────────────
  const app = createApp();

  const server = app.listen(config.server.port, () => {
    logger.info(
      {
        port: config.server.port,
        env: config.env,
        nodeVersion: process.version,
      },
      `Server running on port ${config.server.port} [${config.env}]`,
    );

    // ── 2b. Start background Logistics Outbox Worker if enabled ──────────────────
    if (config.shipping.enableWorker) {
      shippingOutboxWorker.start();
    }
  });

  // ── 3. Graceful shutdown handler ─────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info({ signal }, `Received ${signal}. Starting graceful shutdown...`);

    // Stop shipping outbox worker
    try {
      await shippingOutboxWorker.stop();
    } catch (err) {
      logger.error({ err }, 'Error stopping shipping worker.');
    }

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed. No new connections accepted.');

      try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected cleanly.');
      } catch (err) {
        logger.error({ err }, 'Error disconnecting Prisma during shutdown.');
      }

      logger.info('Graceful shutdown complete. Exiting.');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error(
        { timeoutMs: GRACEFUL_SHUTDOWN_TIMEOUT_MS },
        'Graceful shutdown timed out. Forcing exit.',
      );
      process.exit(1);
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── 4. Catch unhandled rejections and exceptions ─────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled Promise Rejection — shutting down');
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught Exception — shutting down');
    // For uncaught exceptions, exit immediately; state may be corrupt
    process.exit(1);
  });
};

startServer();
