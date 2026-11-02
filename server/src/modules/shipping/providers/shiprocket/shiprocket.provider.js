import { BaseShippingProvider } from '../BaseShippingProvider.js';
import { ShiprocketClient } from './shiprocket.client.js';
import { ShiprocketMock } from './shiprocket.mock.js';
import {
  NormalizedCourierRate,
  NormalizedShipmentResult,
  NormalizedAwbResult,
  NormalizedLabelResult,
  NormalizedPickupResult,
  NormalizedTrackingResult,
  NormalizedTrackingEvent,
} from '../models/normalizedModels.js';
import { logger } from '../../../../common/logger/index.js';
import { config } from '../../../../config/index.js';

export class ShiprocketProvider extends BaseShippingProvider {
  constructor(providerConfig = {}) {
    super('SHIPROCKET', providerConfig);

    const email = providerConfig.email || config.shipping.shiprocketEmail;
    const password = providerConfig.password || config.shipping.shiprocketPassword;
    const baseUrl = providerConfig.baseUrl || config.shipping.shiprocketBaseUrl;

    this.isMock = Boolean(
      config.shipping.isMock ||
      providerConfig.isMock ||
      !email ||
      !password
    );

    if (this.isMock) {
      logger.info('ShiprocketProvider initialized in MOCK / SANDBOX mode.');
      this.mockAdapter = new ShiprocketMock();
    } else {
      logger.info({ email }, 'ShiprocketProvider initialized in LIVE API mode.');
      this.client = new ShiprocketClient({
        baseUrl,
        email,
        password,
      });
    }
  }

  async authenticate() {
    if (this.isMock) {
      return { token: 'mock-shiprocket-token', expiresAt: new Date(Date.now() + 864000000) };
    }
    const token = await this.client.authenticate();
    return { token, expiresAt: this.client.tokenExpiresAt };
  }

  async checkServiceability(params) {
    if (this.isMock) {
      return this.mockAdapter.checkServiceability(params);
    }

    try {
      const response = await this.client.checkServiceability({
        pickupPincode: params.pickupPincode,
        deliveryPincode: params.deliveryPincode,
        weight: params.weight || 0.5,
        cod: params.cod ? 1 : 0,
        length: params.dimensions?.length,
        breadth: params.dimensions?.breadth,
        height: params.dimensions?.height,
        declaredValue: params.declaredValue,
      });

      const companies = response?.data?.available_courier_companies || [];
      const couriers = companies.map((c) => {
        let deliveryDate = null;
        if (c.etd_hours) {
          deliveryDate = new Date(Date.now() + c.etd_hours * 3600 * 1000);
        } else if (c.estimated_delivery_days) {
          deliveryDate = new Date(Date.now() + c.estimated_delivery_days * 24 * 3600 * 1000);
        }

        return new NormalizedCourierRate({
          courierCompanyId: c.courier_company_id,
          courierName: c.courier_name,
          rate: Number(c.rate),
          estimatedDeliveryDays: c.estimated_delivery_days ? Number(c.estimated_delivery_days) : null,
          estimatedDeliveryDate: deliveryDate,
          rating: c.rating ? Number(c.rating) : null,
          isCodAvailable: Boolean(c.cod),
          cutoffTime: c.cutoff_time || null,
          trackingPerformance: c.tracking_performance || null,
          raw: c,
        });
      });

      return {
        serviceable: couriers.length > 0,
        availableCourierCount: couriers.length,
        couriers,
      };
    } catch (err) {
      logger.error({ err: err.message, params }, 'Shiprocket serviceability check failed');
      throw err;
    }
  }

  async calculateShippingRate(params) {
    const result = await this.checkServiceability(params);
    return result.couriers;
  }

  async createShipment(params) {
    if (this.isMock) {
      return this.mockAdapter.createShipment(params);
    }

    const { order, shippingAddress, items, packageDetails, pickupDetails, isCod, courierCompanyId } = params;

    // Transform order items into Shiprocket format
    const orderItems = items.map((item) => ({
      name: item.productName,
      sku: item.productSku,
      units: item.quantity,
      selling_price: Number(item.unitPrice),
      discount: 0,
      tax: 0,
    }));

    // Split customer name into first and last name
    const nameParts = (shippingAddress.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';

    const payload = {
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' '),
      pickup_location: pickupDetails?.pickupLocation || 'Primary Fulfillment Center',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shippingAddress.streetAddress,
      billing_address_2: shippingAddress.apartment || '',
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.postalCode,
      billing_state: shippingAddress.state,
      billing_country: shippingAddress.country || 'India',
      billing_email: order.user?.email || 'customer@example.com',
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: isCod ? 'COD' : 'Prepaid',
      sub_total: Number(order.total),
      length: packageDetails?.length || 15,
      breadth: packageDetails?.breadth || 10,
      height: packageDetails?.height || 5,
      weight: packageDetails?.weight || 0.5,
    };

    if (courierCompanyId) {
      payload.courier_id = Number(courierCompanyId);
    }

    try {
      const response = await this.client.createAdhocOrder(payload);

      return new NormalizedShipmentResult({
        providerShipmentId: response.shipment_id,
        providerOrderId: response.order_id,
        status: 'SHIPMENT_CREATED',
        courierCompanyId,
        shippingCost: 0.0,
        awbCode: response.awb_code || null,
        raw: response,
      });
    } catch (err) {
      logger.error({ err: err.message, orderId: order.id }, 'Shiprocket order creation failed');
      throw err;
    }
  }

  async generateAwb(params) {
    if (this.isMock) {
      return this.mockAdapter.generateAwb(params);
    }

    try {
      const response = await this.client.assignAwb({
        shipmentId: params.providerShipmentId,
        courierId: params.courierCompanyId,
      });

      const data = response?.response?.data || response;
      const awbCode = data.awb_code;
      if (!awbCode) {
        throw new Error(data.error || 'No AWB assigned by Shiprocket.');
      }

      return new NormalizedAwbResult({
        awbCode,
        courierCompanyId: data.courier_company_id || params.courierCompanyId,
        courierName: data.courier_name,
        trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
        raw: response,
      });
    } catch (err) {
      logger.error({ err: err.message, params }, 'Shiprocket AWB assignment failed');
      throw err;
    }
  }

  async generateShippingLabel(params) {
    if (this.isMock) {
      return this.mockAdapter.generateShippingLabel(params);
    }

    try {
      const response = await this.client.generateLabel({
        shipmentId: params.providerShipmentId,
      });

      return new NormalizedLabelResult({
        labelUrl: response.label_url,
        invoiceUrl: response.invoice_url || null,
        manifestUrl: response.manifest_url || null,
        raw: response,
      });
    } catch (err) {
      logger.error({ err: err.message, params }, 'Shiprocket label generation failed');
      throw err;
    }
  }

  async requestPickup(params) {
    if (this.isMock) {
      return this.mockAdapter.requestPickup(params);
    }

    try {
      const response = await this.client.requestPickup({
        shipmentId: params.providerShipmentId,
        pickupDate: params.pickupDate,
      });

      const tokenNumber = response?.response?.pickup_token_number || response?.pickup_token_number || 'PICKUP_REQUESTED';

      return new NormalizedPickupResult({
        pickupToken: tokenNumber,
        pickupDate: params.pickupDate || new Date(),
        status: 'PICKUP_REQUESTED',
        raw: response,
      });
    } catch (err) {
      logger.error({ err: err.message, params }, 'Shiprocket pickup request failed');
      throw err;
    }
  }

  async trackShipment(params) {
    if (this.isMock) {
      return this.mockAdapter.trackShipment(params);
    }

    try {
      const response = await this.client.trackByAwb(params.awbCode);
      const trackData = response?.tracking_data;
      const shipmentTrack = trackData?.shipment_track?.[0] || {};
      const activities = trackData?.shipment_track_activities || [];

      const events = activities.map((act, index) => new NormalizedTrackingEvent({
        eventCode: act['sr-status'] || 'STATUS_UPDATE',
        status: act.status || 'IN_TRANSIT',
        description: act.activity || act.status,
        location: act.location,
        timestamp: act.date ? new Date(act.date) : new Date(),
        externalEventId: `${params.awbCode}-EVT-${index}`,
        raw: act,
      }));

      return new NormalizedTrackingResult({
        awbCode: params.awbCode,
        currentStatus: shipmentTrack.current_status || 'IN_TRANSIT',
        currentLocation: shipmentTrack.current_location || shipmentTrack.destination,
        estimatedDelivery: shipmentTrack.edd ? new Date(shipmentTrack.edd) : null,
        events,
        isDelivered: shipmentTrack.current_status === 'DELIVERED',
        raw: response,
      });
    } catch (err) {
      logger.error({ err: err.message, params }, 'Shiprocket tracking fetch failed');
      throw err;
    }
  }

  async cancelShipment(params) {
    if (this.isMock) {
      return this.mockAdapter.cancelShipment(params);
    }

    try {
      const response = await this.client.cancelOrder({
        orderIds: [params.providerOrderId],
      });

      return {
        success: true,
        message: 'Shiprocket order cancelled successfully.',
        raw: response,
      };
    } catch (err) {
      logger.error({ err: err.message, params }, 'Shiprocket order cancellation failed');
      throw err;
    }
  }
}
