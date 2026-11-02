import { prisma } from '../../../prisma/client.js';
import { logger } from '../../../common/logger/index.js';

export const OutboxEventTypes = Object.freeze({
  ORDER_CONFIRMED_FOR_SHIPMENT: 'ORDER_CONFIRMED_FOR_SHIPMENT',
  SHIPMENT_SYNC_REQUEST: 'SHIPMENT_SYNC_REQUEST',
});

export const outboxService = {
  /**
   * Persist an event inside an active database transaction.
   * Ensures atomic event registration alongside business transactions (orders, payments).
   */
  createEvent: async (tx, { eventType, aggregateId, aggregateType = 'ORDER', payload = {} }) => {
    // Check if an event already exists for this aggregate and eventType to guarantee idempotency
    const existing = await tx.outboxEvent.findFirst({
      where: {
        aggregateId,
        eventType,
        status: { in: ['PENDING', 'PROCESSING', 'PROCESSED'] },
      },
    });

    if (existing) {
      logger.info(
        { aggregateId, eventType, existingEventId: existing.id, status: existing.status },
        'OutboxEvent already exists for aggregate (idempotent skip)'
      );
      return existing;
    }

    return tx.outboxEvent.create({
      data: {
        eventType,
        aggregateType,
        aggregateId,
        payload,
        status: 'PENDING',
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: new Date(),
      },
    });
  },

  /**
   * Fetch and atomically lease a batch of pending events.
   * Recovers stuck locks (> 5 mins) automatically.
   */
  leasePendingEvents: async ({ batchSize = 10, workerId }) => {
    const now = new Date();
    const staleLockThreshold = new Date(now.getTime() - 5 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      // Find candidate event IDs
      const candidates = await tx.outboxEvent.findMany({
        where: {
          OR: [
            {
              status: { in: ['PENDING', 'FAILED'] },
              nextRetryAt: { lte: now },
              lockedAt: null,
            },
            {
              status: 'PROCESSING',
              lockedAt: { lte: staleLockThreshold }, // Recover crashed worker events
            },
          ],
        },
        take: batchSize,
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (candidates.length === 0) {
        return [];
      }

      const ids = candidates.map((c) => c.id);

      // Atomically mark them leased by workerId
      await tx.outboxEvent.updateMany({
        where: { id: { in: ids } },
        data: {
          status: 'PROCESSING',
          lockedAt: now,
          lockedBy: workerId,
        },
      });

      return tx.outboxEvent.findMany({
        where: { id: { in: ids } },
      });
    });
  },

  /**
   * Mark event successfully completed.
   */
  markSuccess: async (eventId) => {
    return prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    });
  },

  /**
   * Record failure, increment retry count, compute next exponential backoff,
   * or move to DEAD_LETTER if maxRetries exceeded.
   */
  markFailure: async (eventId, error, backoffBaseMs = 3000) => {
    const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } });
    if (!event) return;

    const nextRetryCount = event.retryCount + 1;
    const isDeadLetter = nextRetryCount >= event.maxRetries;

    // Exponential backoff: base * 2^(retryCount), capped at 10 minutes
    const delayMs = Math.min(backoffBaseMs * Math.pow(2, nextRetryCount - 1), 600000);
    const nextRetryAt = isDeadLetter ? null : new Date(Date.now() + delayMs);

    return prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: isDeadLetter ? 'DEAD_LETTER' : 'FAILED',
        retryCount: nextRetryCount,
        nextRetryAt,
        lastError: error.message || String(error),
        lockedAt: null,
        lockedBy: null,
      },
    });
  },
};
