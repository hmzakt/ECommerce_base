import {
  NormalizedCourierRate,
  NormalizedShipmentResult,
  NormalizedAwbResult,
  NormalizedLabelResult,
  NormalizedPickupResult,
  NormalizedTrackingResult,
  NormalizedTrackingEvent,
} from '../models/normalizedModels.js';

export class ShiprocketMock {
  constructor() {
    this.mockCouriers = [
      {
        courierCompanyId: 101,
        courierName: 'Blue Dart Express (Air)',
        baseRate: 95.0,
        ratePerKg: 40.0,
        estimatedDeliveryDays: 2,
        rating: 4.8,
        isCodAvailable: true,
      },
      {
        courierCompanyId: 102,
        courierName: 'Delhivery Surface',
        baseRate: 55.0,
        ratePerKg: 25.0,
        estimatedDeliveryDays: 4,
        rating: 4.3,
        isCodAvailable: true,
      },
      {
        courierCompanyId: 103,
        courierName: 'Ekart Logistics',
        baseRate: 65.0,
        ratePerKg: 30.0,
        estimatedDeliveryDays: 3,
        rating: 4.5,
        isCodAvailable: true,
      },
      {
        courierCompanyId: 104,
        courierName: 'DTDC Surface Standard',
        baseRate: 48.0,
        ratePerKg: 22.0,
        estimatedDeliveryDays: 5,
        rating: 4.0,
        isCodAvailable: false,
      },
      {
        courierCompanyId: 105,
        courierName: 'Shadowfax Quick Delivery',
        baseRate: 75.0,
        ratePerKg: 35.0,
        estimatedDeliveryDays: 2,
        rating: 4.2,
        isCodAvailable: true,
      },
    ];
  }

  async checkServiceability({ pickupPincode, deliveryPincode, weight = 0.5, cod = false }) {
    // If delivery pincode starts with '000', treat as unserviceable for negative testing
    if (String(deliveryPincode).startsWith('000') || String(deliveryPincode).length !== 6) {
      return {
        serviceable: false,
        availableCourierCount: 0,
        couriers: [],
      };
    }

    const couriers = this.mockCouriers
      .filter((c) => (!cod || c.isCodAvailable))
      .map((c) => {
        const calculatedRate = Number((c.baseRate + Math.max(0, weight - 0.5) * c.ratePerKg).toFixed(2));
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + c.estimatedDeliveryDays);

        return new NormalizedCourierRate({
          courierCompanyId: c.courierCompanyId,
          courierName: c.courierName,
          rate: calculatedRate,
          estimatedDeliveryDays: c.estimatedDeliveryDays,
          estimatedDeliveryDate: deliveryDate,
          rating: c.rating,
          isCodAvailable: c.isCodAvailable,
          cutoffTime: '18:00',
          raw: { mock: true, provider: 'SHIPROCKET' },
        });
      });

    return {
      serviceable: couriers.length > 0,
      availableCourierCount: couriers.length,
      couriers,
    };
  }

  async createShipment({ order, shippingAddress, items, packageDetails, isCod, courierCompanyId }) {
    const timestamp = Date.now().toString().slice(-6);
    const mockProviderShipmentId = `MOCK-SR-SHIP-${timestamp}`;
    const mockProviderOrderId = `MOCK-SR-ORD-${timestamp}`;

    const courier = this.mockCouriers.find((c) => c.courierCompanyId === Number(courierCompanyId)) || this.mockCouriers[0];
    const weight = packageDetails?.weight || 0.5;
    const rate = Number((courier.baseRate + Math.max(0, weight - 0.5) * courier.ratePerKg).toFixed(2));

    return new NormalizedShipmentResult({
      providerShipmentId: mockProviderShipmentId,
      providerOrderId: mockProviderOrderId,
      status: 'SHIPMENT_CREATED',
      courierCompanyId: courier.courierCompanyId,
      courierName: courier.courierName,
      shippingCost: rate,
      awbCode: null,
      labelUrl: null,
      raw: { mock: true, provider: 'SHIPROCKET', orderId: order.id },
    });
  }

  async generateAwb({ providerShipmentId, courierCompanyId }) {
    const courier = this.mockCouriers.find((c) => c.courierCompanyId === Number(courierCompanyId)) || this.mockCouriers[0];
    const prefix = courier.courierName.split(' ')[0].toUpperCase();
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const awbCode = `${prefix}${randomSuffix}`;
    const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

    return new NormalizedAwbResult({
      awbCode,
      courierCompanyId: courier.courierCompanyId,
      courierName: courier.courierName,
      trackingUrl,
      raw: { mock: true, providerShipmentId },
    });
  }

  async generateShippingLabel({ providerShipmentId, awbCode }) {
    const labelUrl = `https://apiv2.shiprocket.in/mock-labels/label_${awbCode || providerShipmentId}.pdf`;
    const manifestUrl = `https://apiv2.shiprocket.in/mock-labels/manifest_${awbCode || providerShipmentId}.pdf`;
    const invoiceUrl = `https://apiv2.shiprocket.in/mock-labels/invoice_${awbCode || providerShipmentId}.pdf`;

    return new NormalizedLabelResult({
      labelUrl,
      manifestUrl,
      invoiceUrl,
      raw: { mock: true, providerShipmentId, awbCode },
    });
  }

  async requestPickup({ providerShipmentId, pickupDate }) {
    const pickupToken = `PK-${Date.now().toString().slice(-8)}`;
    const scheduledDate = pickupDate ? new Date(pickupDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    return new NormalizedPickupResult({
      pickupToken,
      pickupDate: scheduledDate,
      status: 'PICKUP_SCHEDULED',
      raw: { mock: true, providerShipmentId },
    });
  }

  async trackShipment({ awbCode }) {
    const now = new Date();
    const eventTime1 = new Date(now.getTime() - 24 * 3600 * 1000);
    const eventTime2 = new Date(now.getTime() - 12 * 3600 * 1000);
    const eventTime3 = new Date(now.getTime() - 2 * 3600 * 1000);

    const events = [
      new NormalizedTrackingEvent({
        eventCode: '101',
        status: 'SHIPMENT_CREATED',
        description: 'Shipment created and registered in logistics network',
        location: 'Gurugram Warehouse',
        timestamp: eventTime1,
        externalEventId: `${awbCode}-EVT-1`,
      }),
      new NormalizedTrackingEvent({
        eventCode: '102',
        status: 'PICKED_UP',
        description: 'Package picked up by courier dispatch associate',
        location: 'Gurugram Hub',
        timestamp: eventTime2,
        externalEventId: `${awbCode}-EVT-2`,
      }),
      new NormalizedTrackingEvent({
        eventCode: '103',
        status: 'IN_TRANSIT',
        description: 'Package in transit to destination sorting facility',
        location: 'Delhi Sorting Centre',
        timestamp: eventTime3,
        externalEventId: `${awbCode}-EVT-3`,
      }),
    ];

    const estimatedDelivery = new Date(now.getTime() + 48 * 3600 * 1000);

    return new NormalizedTrackingResult({
      awbCode,
      currentStatus: 'IN_TRANSIT',
      currentLocation: 'Delhi Sorting Centre',
      estimatedDelivery,
      events,
      isDelivered: false,
      raw: { mock: true, awbCode },
    });
  }

  async cancelShipment({ providerOrderId }) {
    return {
      success: true,
      message: `Shipment for provider order ${providerOrderId} was successfully cancelled in mock environment.`,
    };
  }
}
