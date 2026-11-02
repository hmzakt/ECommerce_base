import { prisma } from '../../../prisma/client.js';

export const shipmentRepository = {
  /**
   * Create a new shipment record.
   */
  createShipment: async (data, tx = prisma) => {
    return tx.shipment.create({
      data,
      include: {
        order: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            shippingAddress: true,
          },
        },
      },
    });
  },

  /**
   * Find shipment by primary ID.
   */
  findById: async (id, tx = prisma) => {
    return tx.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            shippingAddress: true,
            items: true,
          },
        },
        events: {
          orderBy: { eventTimestamp: 'desc' },
        },
        attempts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  /**
   * Find active shipment for an order.
   */
  findActiveByOrderId: async (orderId, tx = prisma) => {
    return tx.shipment.findFirst({
      where: {
        orderId,
        isActive: true,
      },
      include: {
        order: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            shippingAddress: true,
          },
        },
        events: {
          orderBy: { eventTimestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find shipment by AWB code.
   */
  findByAwb: async (awbCode, tx = prisma) => {
    return tx.shipment.findFirst({
      where: { awbCode },
      include: {
        order: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            shippingAddress: true,
          },
        },
        events: {
          orderBy: { eventTimestamp: 'desc' },
        },
      },
    });
  },

  /**
   * Query paginated shipments with filters.
   */
  findMany: async ({ skip = 0, take = 20, status, search, fromDate, toDate }) => {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (search) {
      where.OR = [
        { awbCode: { contains: search, mode: 'insensitive' } },
        { externalShipmentId: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { order: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return prisma.shipment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            shippingAddress: { select: { city: true, state: true, postalCode: true } },
          },
        },
      },
    });
  },

  /**
   * Count total shipments matching filter.
   */
  countMany: async ({ status, search, fromDate, toDate }) => {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    if (search) {
      where.OR = [
        { awbCode: { contains: search, mode: 'insensitive' } },
        { externalShipmentId: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { order: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return prisma.shipment.count({ where });
  },

  /**
   * Update shipment record.
   */
  updateShipment: async (id, data, tx = prisma) => {
    return tx.shipment.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  },

  /**
   * Record tracking event. Idempotent on [shipmentId, externalEventId].
   */
  recordEvent: async ({ shipmentId, eventCode, eventStatus, eventDescription, eventLocation, eventTimestamp, eventSource = 'SYSTEM', externalEventId, rawPayload }, tx = prisma) => {
    // Prevent duplicate event persistence
    if (externalEventId) {
      const existing = await tx.shipmentEvent.findUnique({
        where: {
          shipmentId_externalEventId: {
            shipmentId,
            externalEventId,
          },
        },
      });
      if (existing) {
        return existing;
      }
    }

    return tx.shipmentEvent.create({
      data: {
        shipmentId,
        eventCode,
        eventStatus,
        eventDescription,
        eventLocation,
        eventTimestamp: eventTimestamp ? new Date(eventTimestamp) : new Date(),
        eventSource,
        externalEventId,
        rawPayload,
      },
    });
  },

  /**
   * Record an operational attempt (success or failure) with sanitized payload.
   */
  recordAttempt: async ({ orderId, shipmentId = null, provider, operation, attemptNumber = 1, correlationId, status, errorCode = null, errorMessage = null, requestPayload = null, responsePayload = null }, tx = prisma) => {
    return tx.shippingAttempt.create({
      data: {
        orderId,
        shipmentId,
        provider,
        operation,
        attemptNumber,
        correlationId,
        status,
        errorCode,
        errorMessage,
        requestPayload,
        responsePayload,
      },
    });
  },
};
