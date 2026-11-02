/**
 * Ekart Logistics Direct API Adapter Stub
 *
 * Requirements for Production Enablement:
 * 1. Merchant Agreement: Signed SLA with Ekart Logistics / Flipkart Supply Chain.
 * 2. Merchant Code & Access Key: Provided via Ekart Developer Console.
 * 3. Base URLs:
 *    - Production: https://api.ekartlogistics.com
 *    - Sandbox: https://sandbox.ekartlogistics.com
 * 4. Key Endpoints:
 *    - Serviceability & Pincode Lookup: GET /v2/pincode/{pincode}/serviceability
 *    - Create Shipment: POST /v2/shipments/create
 *    - Tracking: GET /v2/shipments/track/{tracking_id}
 *    - Label: GET /v2/shipments/{tracking_id}/label
 *    - Cancellation: POST /v2/shipments/cancel
 */

import { BaseShippingProvider } from '../BaseShippingProvider.js';
import { AppError } from '../../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../../common/errors/errorCodes.js';

export class EkartAdapter extends BaseShippingProvider {
  constructor(providerConfig = {}) {
    super('EKART', providerConfig);
    this.merchantCode = providerConfig.merchantCode;
    this.accessKey = providerConfig.accessKey;
    this.environment = providerConfig.environment || 'SANDBOX';
  }

  _ensureEnabled() {
    throw AppError.badRequest(
      'Ekart Logistics direct integration is not currently active. Please provision merchant API credentials or route via the primary aggregator.',
      ErrorCodes.SHIPPING_PROVIDER_UNAVAILABLE
    );
  }

  async authenticate() {
    this._ensureEnabled();
  }

  async checkServiceability(params) {
    this._ensureEnabled();
  }

  async calculateShippingRate(params) {
    this._ensureEnabled();
  }

  async createShipment(params) {
    this._ensureEnabled();
  }

  async generateAwb(params) {
    this._ensureEnabled();
  }

  async generateShippingLabel(params) {
    this._ensureEnabled();
  }

  async requestPickup(params) {
    this._ensureEnabled();
  }

  async trackShipment(params) {
    this._ensureEnabled();
  }

  async cancelShipment(params) {
    this._ensureEnabled();
  }
}
