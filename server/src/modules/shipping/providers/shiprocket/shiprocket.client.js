import { logger } from '../../../../common/logger/index.js';
import { AppError } from '../../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../../common/errors/errorCodes.js';

export class ShiprocketClient {
  constructor({ baseUrl, email, password, timeoutMs = 15000 }) {
    this.baseUrl = (baseUrl || 'https://apiv2.shiprocket.in/v1/external').replace(/\/+$/, '');
    this.email = email;
    this.password = password;
    this.timeoutMs = timeoutMs;
    this.cachedToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Check if credentials are configured.
   */
  hasCredentials() {
    return Boolean(this.email && this.password);
  }

  /**
   * Authenticate with Shiprocket and retrieve/cache Bearer token.
   * Shiprocket tokens are typically valid for 10 days. We set a 9-day buffer.
   */
  async authenticate(forceRefresh = false) {
    if (!this.hasCredentials()) {
      throw AppError.badRequest(
        'Shiprocket credentials (email and password) are not configured.',
        ErrorCodes.SHIPPING_PROVIDER_AUTH_FAILED
      );
    }

    const now = new Date();
    if (!forceRefresh && this.cachedToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    try {
      logger.info({ email: this.email }, 'Authenticating with Shiprocket API...');
      const response = await this._rawRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      }, false);

      if (!response.token) {
        throw new Error(response.message || 'Shiprocket login succeeded but no token was returned.');
      }

      this.cachedToken = response.token;
      // Expire in 9 days (Shiprocket is 10 days)
      this.tokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      logger.info('Shiprocket authentication token acquired and cached.');
      return this.cachedToken;
    } catch (err) {
      logger.error({ err: err.message }, 'Shiprocket authentication failed');
      throw AppError.internal(
        `Failed to authenticate with Shiprocket: ${err.message}`,
        ErrorCodes.SHIPPING_PROVIDER_AUTH_FAILED
      );
    }
  }

  /**
   * Base HTTP request wrapper with timeout, token injection, and automatic 401 retry.
   */
  async _rawRequest(endpoint, options = {}, requiresAuth = true) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    if (requiresAuth) {
      const token = await this.authenticate(false);
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 unauthorized - retry once with refreshed token
      if (res.status === 401 && requiresAuth) {
        logger.warn('Shiprocket 401 Unauthorized encountered. Refreshing token and retrying...');
        const newToken = await this.authenticate(true);
        headers.Authorization = `Bearer ${newToken}`;

        const retryRes = await fetch(url, {
          ...options,
          headers,
        });

        const retryData = await retryRes.json().catch(() => ({}));
        if (!retryRes.ok) {
          throw new Error(retryData.message || `HTTP ${retryRes.status}: ${retryRes.statusText}`);
        }
        return retryData;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.message || (typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors || {})) || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Shiprocket API request timed out after ${this.timeoutMs}ms: ${endpoint}`);
      }
      throw err;
    }
  }

  /**
   * Check route serviceability and fetch available courier rates.
   * GET /courier/serviceability/
   */
  async checkServiceability({ pickupPincode, deliveryPincode, weight, cod = 0, length, breadth, height, declaredValue }) {
    const query = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: String(weight),
      cod: cod ? '1' : '0',
    });

    if (length) query.append('length', String(length));
    if (breadth) query.append('breadth', String(breadth));
    if (height) query.append('height', String(height));
    if (declaredValue) query.append('declared_value', String(declaredValue));

    return this._rawRequest(`/courier/serviceability/?${query.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * Create an adhoc order in Shiprocket.
   * POST /orders/create/adhoc
   */
  async createAdhocOrder(orderPayload) {
    return this._rawRequest('/orders/create/adhoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
  }

  /**
   * Assign AWB to created shipment.
   * POST /courier/assign/awb
   */
  async assignAwb({ shipmentId, courierId }) {
    const payload = { shipment_id: String(shipmentId) };
    if (courierId) {
      payload.courier_id = Number(courierId);
    }

    return this._rawRequest('/courier/assign/awb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Generate shipping label.
   * POST /generate/label
   */
  async generateLabel({ shipmentId }) {
    return this._rawRequest('/generate/label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipment_id: Array.isArray(shipmentId) ? shipmentId.map(String) : [String(shipmentId)],
      }),
    });
  }

  /**
   * Request courier pickup.
   * POST /couriers/generate/pickup
   */
  async requestPickup({ shipmentId, pickupDate }) {
    const payload = {
      shipment_id: Array.isArray(shipmentId) ? shipmentId.map(String) : [String(shipmentId)],
    };
    if (pickupDate) {
      payload.pickup_date = Array.isArray(pickupDate) ? pickupDate : [pickupDate];
    }

    return this._rawRequest('/couriers/generate/pickup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Track shipment by AWB code.
   * GET /courier/track/awb/:awb_code
   */
  async trackByAwb(awbCode) {
    return this._rawRequest(`/courier/track/awb/${encodeURIComponent(awbCode)}`, {
      method: 'GET',
    });
  }

  /**
   * Cancel order.
   * POST /orders/cancel
   */
  async cancelOrder({ orderIds }) {
    return this._rawRequest('/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: Array.isArray(orderIds) ? orderIds : [orderIds],
      }),
    });
  }
}
