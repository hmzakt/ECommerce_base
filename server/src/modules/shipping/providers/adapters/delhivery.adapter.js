/**
 * Delhivery Direct API Adapter Stub
 *
 * Requirements for Production Enablement:
 * 1. Business Contract: Active enterprise account with Delhivery Express.
 * 2. API Token: Permanent client token generated from Delhivery Unified Portal (B2C Express).
 * 3. Base URLs:
 *    - Production: https://track.delhivery.com
 *    - Staging: https://staging-express.delhivery.com
 * 4. Endpoints:
 *    - Serviceability: GET /c/api/pin-codes/json/?filter_codes={pincode}
 *    - Waybill Generation: GET /waybill/api/bulk/json/?count=1
 *    - Order Creation: POST /api/cmu/create.json (multipart/form-data with format=json and data payload)
 *    - Tracking: GET /api/v1/packages/json/?waybill={waybill}
 *    - Pickup Request: POST /fm/request/new/
 *    - Cancellation: POST /api/p/edit (status="Cancelled")
 */

import { BaseShippingProvider } from '../BaseShippingProvider.js';
import { AppError } from '../../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../../common/errors/errorCodes.js';

export class DelhiveryAdapter extends BaseShippingProvider {
  constructor(providerConfig = {}) {
    super('DELHIVERY', providerConfig);
    this.apiToken = providerConfig.apiToken;
    this.clientName = providerConfig.clientName;
    this.environment = providerConfig.environment || 'SANDBOX';
  }

  _ensureEnabled() {
    throw AppError.badRequest(
      'Delhivery direct integration is not currently active. Please provision Delhivery enterprise API credentials or use the configured aggregator.',
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
