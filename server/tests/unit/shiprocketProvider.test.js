import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ShiprocketProvider } from '../../src/modules/shipping/providers/shiprocket/shiprocket.provider.js';
import { ShiprocketMock } from '../../src/modules/shipping/providers/shiprocket/shiprocket.mock.js';
import {
  NormalizedCourierRate,
  NormalizedShipmentResult,
  NormalizedAwbResult,
  NormalizedLabelResult,
  NormalizedPickupResult,
  NormalizedTrackingResult,
} from '../../src/modules/shipping/providers/models/normalizedModels.js';

describe('Shiprocket Provider & Models Unit Tests', () => {
  it('Normalized models instantiate with typed fields and defaults', () => {
    const rate = new NormalizedCourierRate({
      courierCompanyId: 10,
      courierName: 'Delhivery Surface',
      rate: '65.50',
      estimatedDeliveryDays: '3',
      rating: '4.5',
      isCodAvailable: 1,
    });

    assert.equal(typeof rate.rate, 'number');
    assert.equal(rate.rate, 65.5);
    assert.equal(rate.estimatedDeliveryDays, 3);
    assert.equal(rate.rating, 4.5);
    assert.equal(rate.isCodAvailable, true);
  });

  it('ShiprocketMock returns serviceable couriers for valid Indian PIN codes', async () => {
    const mock = new ShiprocketMock();
    const result = await mock.checkServiceability({
      pickupPincode: '122015',
      deliveryPincode: '560001',
      weight: 0.8,
      cod: false,
    });

    assert.equal(result.serviceable, true);
    assert.ok(result.availableCourierCount > 0);
    assert.ok(result.couriers.every((c) => c instanceof NormalizedCourierRate));
    assert.ok(result.couriers.every((c) => c.rate > 0));
  });

  it('ShiprocketMock filters out non-COD couriers when cod=true', async () => {
    const mock = new ShiprocketMock();
    const result = await mock.checkServiceability({
      pickupPincode: '122015',
      deliveryPincode: '560001',
      weight: 0.5,
      cod: true,
    });

    assert.ok(result.couriers.every((c) => c.isCodAvailable === true));
  });

  it('ShiprocketMock marks invalid pincodes (e.g. starting with 000) as unserviceable', async () => {
    const mock = new ShiprocketMock();
    const result = await mock.checkServiceability({
      pickupPincode: '122015',
      deliveryPincode: '000111',
      weight: 0.5,
    });

    assert.equal(result.serviceable, false);
    assert.equal(result.couriers.length, 0);
  });

  it('ShiprocketProvider in mock mode creates normalized shipment result', async () => {
    const provider = new ShiprocketProvider({ isMock: true });

    const shipmentResult = await provider.createShipment({
      order: { id: 'test-order-uuid', orderNumber: 'ORD-20261102-TEST' },
      shippingAddress: { fullName: 'Priya Sharma', streetAddress: '123 MG Road', postalCode: '560001' },
      items: [{ productName: 'Ceramic Vase', productSku: 'CV-01', quantity: 1, unitPrice: 850 }],
      packageDetails: { weight: 0.5, length: 15, breadth: 10, height: 10 },
      isCod: false,
      courierCompanyId: 101,
    });

    assert.ok(shipmentResult instanceof NormalizedShipmentResult);
    assert.ok(shipmentResult.providerShipmentId.includes('MOCK-SR-SHIP'));
    assert.equal(shipmentResult.status, 'SHIPMENT_CREATED');
    assert.equal(shipmentResult.courierCompanyId, 101);
  });

  it('ShiprocketProvider generates AWB with tracking URL', async () => {
    const provider = new ShiprocketProvider({ isMock: true });

    const awbResult = await provider.generateAwb({
      providerShipmentId: 'MOCK-SR-SHIP-123456',
      courierCompanyId: 101,
    });

    assert.ok(awbResult instanceof NormalizedAwbResult);
    assert.ok(awbResult.awbCode.length > 5);
    assert.match(awbResult.trackingUrl, /https:\/\/shiprocket\.co\/tracking\//);
  });

  it('ShiprocketProvider generates shipping labels with manifest and invoice URLs', async () => {
    const provider = new ShiprocketProvider({ isMock: true });

    const labelResult = await provider.generateShippingLabel({
      providerShipmentId: 'MOCK-SR-SHIP-123456',
      awbCode: 'BLUEDART998877',
    });

    assert.ok(labelResult instanceof NormalizedLabelResult);
    assert.match(labelResult.labelUrl, /\.pdf$/);
    assert.match(labelResult.invoiceUrl, /\.pdf$/);
  });

  it('ShiprocketProvider schedules pickup and returns pickup token', async () => {
    const provider = new ShiprocketProvider({ isMock: true });

    const pickupResult = await provider.requestPickup({
      providerShipmentId: 'MOCK-SR-SHIP-123456',
    });

    assert.ok(pickupResult instanceof NormalizedPickupResult);
    assert.match(pickupResult.pickupToken, /^PK-/);
    assert.equal(pickupResult.status, 'PICKUP_SCHEDULED');
  });

  it('ShiprocketProvider returns complete tracking history with ordered events', async () => {
    const provider = new ShiprocketProvider({ isMock: true });

    const trackingResult = await provider.trackShipment({
      awbCode: 'BLUEDART998877',
    });

    assert.ok(trackingResult instanceof NormalizedTrackingResult);
    assert.equal(trackingResult.awbCode, 'BLUEDART998877');
    assert.equal(trackingResult.currentStatus, 'IN_TRANSIT');
    assert.ok(trackingResult.events.length >= 3);
    assert.ok(trackingResult.events[0].description);
  });

  it('ShiprocketProvider cancels active shipment gracefully', async () => {
    const provider = new ShiprocketProvider({ isMock: true });

    const cancelResult = await provider.cancelShipment({
      providerOrderId: 'MOCK-SR-ORD-123456',
    });

    assert.equal(cancelResult.success, true);
    assert.match(cancelResult.message, /successfully cancelled/);
  });
});
