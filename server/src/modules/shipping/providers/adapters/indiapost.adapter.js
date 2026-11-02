/**
 * India Post Speed Post Direct API Adapter Stub
 *
 * Requirements for Production Enablement:
 * 1. BNPL Account: Book Now Pay Later (BNPL) registration with the Department of Posts (DoP).
 * 2. SFTP & Web Services Credentials: Integration with India Post Parcel Tracking and Booking system (PTBS).
 * 3. Base URLs & Security:
 *    - Production Web Service Gateway: https://ptbs.cept.gov.in / SOAP/REST endpoint
 *    - Requires Static IP Whitelisting and Client SSL certificate authentication.
 * 4. India Post Aggregator Caution:
 *    - Direct India Post integration cannot be substituted by aggregators unless the specific PIN code
 *      coverage is formally contracted and verified in aggregator rate cards.
 */

import { BaseShippingProvider } from '../BaseShippingProvider.js';
import { AppError } from '../../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../../common/errors/errorCodes.js';

export class IndiaPostAdapter extends BaseShippingProvider {
  constructor(providerConfig = {}) {
    super('INDIAPOST', providerConfig);
    this.bnplCustomerId = providerConfig.bnplCustomerId;
    this.contractId = providerConfig.contractId;
  }

  _ensureEnabled() {
    throw AppError.badRequest(
      'India Post direct integration is not currently active. Direct Speed Post integration requires an active BNPL enterprise contract and CEPT network whitelisting.',
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
