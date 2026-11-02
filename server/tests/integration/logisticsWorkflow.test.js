import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../src/prisma/client.js';
import { logisticsService } from '../../src/modules/shipping/services/logistics.service.js';
import { outboxService, OutboxEventTypes } from '../../src/modules/shipping/services/outbox.service.js';
import { shippingService } from '../../src/modules/shipping/services/shipping.service.js';
import { shipmentRepository } from '../../src/modules/shipping/repositories/shipment.repository.js';
import { shippingSettingsRepository } from '../../src/modules/shipping/repositories/shippingSettings.repository.js';

describe('Logistics & Shipping End-to-End Workflow Integration Tests', () => {
  let testUser;
  let unauthorizedUser;
  let testCategory;
  let testProduct;
  let testOrder;

  before(async () => {
    // 1. Create test user
    const uniqueSuffix = uuidv4().slice(0, 8);
    testUser = await prisma.user.create({
      data: {
        email: `shipper_${uniqueSuffix}@example.com`,
        passwordHash: 'dummy_hash',
        firstName: 'Ananya',
        lastName: 'Roy',
        role: 'CUSTOMER',
      },
    });

    unauthorizedUser = await prisma.user.create({
      data: {
        email: `unauthorized_${uniqueSuffix}@example.com`,
        passwordHash: 'dummy_hash',
        firstName: 'Stranger',
        lastName: 'Danger',
        role: 'CUSTOMER',
      },
    });

    // 2. Create test category and product with dimension attributes
    testCategory = await prisma.category.create({
      data: {
        name: `Decor_${uniqueSuffix}`,
        slug: `decor-${uniqueSuffix}`,
        isActive: true,
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Terracotta Lamp',
        slug: `terracotta-lamp-${uniqueSuffix}`,
        sku: `SKU-${uniqueSuffix}`,
        brand: 'Maison Atelier',
        price: 1450.0,
        categoryId: testCategory.id,
        weight: 0.750,
        length: 22.0,
        breadth: 18.0,
        height: 15.0,
        isActive: true,
      },
    });

    // 3. Create test order with shipping address and order items
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${uniqueSuffix}`,
        userId: testUser.id,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        subtotal: 1450.0,
        shippingCost: 0.0,
        tax: 0.0,
        total: 1450.0,
        shippingAddress: {
          create: {
            fullName: 'Ananya Roy',
            streetAddress: 'Flat 402, Lotus Tower, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
            phone: '9876543210',
          },
        },
        items: {
          create: {
            productId: testProduct.id,
            productName: testProduct.name,
            productSku: testProduct.sku,
            unitPrice: testProduct.price,
            quantity: 1,
            lineTotal: testProduct.price,
          },
        },
      },
      include: {
        shippingAddress: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  });

  after(async () => {
    // Clean up test data safely in reverse order
    try {
      if (testOrder) {
        await prisma.shipmentEvent.deleteMany({ where: { shipment: { orderId: testOrder.id } } });
        await prisma.shippingAttempt.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.shipment.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.shipping.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.outboxEvent.deleteMany({ where: { aggregateId: testOrder.id } });
        await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.shippingAddress.deleteMany({ where: { orderId: testOrder.id } });
        await prisma.order.delete({ where: { id: testOrder.id } });
      }
      if (testProduct) await prisma.product.delete({ where: { id: testProduct.id } });
      if (testCategory) await prisma.category.delete({ where: { id: testCategory.id } });
      if (testUser) await prisma.user.delete({ where: { id: testUser.id } });
      if (unauthorizedUser) await prisma.user.delete({ where: { id: unauthorizedUser.id } });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('Calculate package metrics derives weight and dimensions from products', async () => {
    const settings = await shippingSettingsRepository.getSettings();
    const metrics = logisticsService.calculatePackageMetrics(testOrder, settings);

    assert.equal(metrics.weight, 0.75);
    assert.equal(metrics.length, 22.0);
    assert.equal(metrics.breadth, 18.0);
    assert.equal(metrics.height, 15.0);
  });

  it('Transactional Outbox persists event atomically and idempotently', async () => {
    // Simulate order confirmation event creation
    const event1 = await prisma.$transaction(async (tx) => {
      return outboxService.createEvent(tx, {
        eventType: OutboxEventTypes.ORDER_CONFIRMED_FOR_SHIPMENT,
        aggregateId: testOrder.id,
        aggregateType: 'ORDER',
        payload: { orderId: testOrder.id, amount: 1450.0 },
      });
    });

    assert.ok(event1.id);
    assert.equal(event1.status, 'PENDING');
    assert.equal(event1.aggregateId, testOrder.id);

    // Duplicate call returns existing event without creating duplicate
    const event2 = await prisma.$transaction(async (tx) => {
      return outboxService.createEvent(tx, {
        eventType: OutboxEventTypes.ORDER_CONFIRMED_FOR_SHIPMENT,
        aggregateId: testOrder.id,
        aggregateType: 'ORDER',
      });
    });

    assert.equal(event2.id, event1.id);
  });

  it('Outbox worker leases pending events with atomic lock', async () => {
    const workerId = `test-worker-${process.pid}`;
    const leasedEvents = await outboxService.leasePendingEvents({ batchSize: 5, workerId });

    const matched = leasedEvents.find((e) => e.aggregateId === testOrder.id);
    assert.ok(matched, 'Order event should be leased by worker');
    assert.equal(matched.status, 'PROCESSING');
    assert.equal(matched.lockedBy, workerId);
    assert.ok(matched.lockedAt instanceof Date);
  });

  it('End-to-End Shipment Processing: generates AWB, label, pickup, and updates Order to SHIPPED', async () => {
    const shipment = await logisticsService.processOrderShipment(testOrder.id, {
      correlationId: `integration-test-${Date.now()}`,
    });

    assert.ok(shipment);
    assert.equal(shipment.orderId, testOrder.id);
    assert.ok(shipment.awbCode, 'AWB code must be assigned');
    assert.ok(shipment.externalShipmentId, 'External shipment ID must be stored');
    assert.ok(shipment.trackingUrl, 'Tracking URL must be generated');
    assert.ok(shipment.labelUrl, 'Label URL must be stored');
    assert.ok(shipment.pickupRequestId, 'Pickup token must be stored');
    assert.equal(shipment.status, 'PICKUP_REQUESTED');
    assert.equal(shipment.isActive, true);

    // Verify events were persisted
    assert.ok(shipment.events.length >= 2);

    // Verify order status moved to SHIPPED
    const updatedOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
    assert.equal(updatedOrder.status, 'SHIPPED');

    // Verify legacy shipping table was synchronized
    const legacyShipping = await prisma.shipping.findUnique({ where: { orderId: testOrder.id } });
    assert.equal(legacyShipping.trackingNumber, shipment.awbCode);
    assert.equal(legacyShipping.status, 'SHIPPED');
  });

  it('Idempotency Guard: Reprocessing the same order does NOT create duplicate shipments', async () => {
    const initialShipments = await prisma.shipment.findMany({ where: { orderId: testOrder.id } });
    assert.equal(initialShipments.length, 1);

    // Call processOrderShipment again
    const secondCallResult = await logisticsService.processOrderShipment(testOrder.id, {
      correlationId: `integration-test-duplicate-${Date.now()}`,
    });

    assert.equal(secondCallResult.id, initialShipments[0].id);

    // Total count in database remains exactly 1
    const finalShipments = await prisma.shipment.findMany({ where: { orderId: testOrder.id } });
    assert.equal(finalShipments.length, 1);
  });

  it('Live Tracking Synchronization: fetches events and avoids duplicate event rows', async () => {
    const activeShipment = await shipmentRepository.findActiveByOrderId(testOrder.id);
    const updatedShipment = await logisticsService.syncTracking(activeShipment.id);

    assert.ok(updatedShipment.events.length >= 3);

    const initialEventCount = updatedShipment.events.length;

    // Call syncTracking a second time - verify unique external event constraint prevents duplicate rows
    const resyncedShipment = await logisticsService.syncTracking(activeShipment.id);
    assert.equal(resyncedShipment.events.length, initialEventCount);
  });

  it('Customer Tracking Endpoint: returns rich logistics data to owner and forbids unauthorized user', async () => {
    // 1. Authorized customer tracking request
    const trackingData = await shippingService.getShippingByOrderId(
      testUser.id,
      testOrder.id,
      'CUSTOMER'
    );

    assert.equal(trackingData.orderId, testOrder.id);
    assert.ok(trackingData.awbCode);
    assert.ok(trackingData.trackingUrl);
    assert.ok(trackingData.events.length > 0);
    assert.equal(trackingData.status, 'IN_TRANSIT');

    // 2. Unauthorized user tracking request rejected with 403 Forbidden
    await assert.rejects(
      async () => {
        await shippingService.getShippingByOrderId(
          unauthorizedUser.id,
          testOrder.id,
          'CUSTOMER'
        );
      },
      {
        message: /You do not have permission to track this order/,
      }
    );
  });

  it('Shipment Cancellation: cancels shipment, sets isActive=false, and logs audit event', async () => {
    const activeShipment = await shipmentRepository.findActiveByOrderId(testOrder.id);

    const cancelledShipment = await logisticsService.cancelShipment(
      activeShipment.id,
      'Integration test cancellation'
    );

    assert.equal(cancelledShipment.status, 'CANCELLED');
    assert.equal(cancelledShipment.isActive, false);

    // Verify cancellation audit event in history
    const events = await prisma.shipmentEvent.findMany({
      where: { shipmentId: activeShipment.id },
      orderBy: { createdAt: 'desc' },
    });

    const cancelEvent = events.find((e) => e.eventCode === 'CANCELLED');
    assert.ok(cancelEvent);
    assert.match(cancelEvent.eventDescription, /Integration test cancellation/);
  });
});
