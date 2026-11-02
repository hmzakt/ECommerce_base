/**
 * Abstract Base Shipping Provider
 *
 * Defines the contract that every logistics aggregator or direct courier provider
 * (Shiprocket, Delhivery, Ekart, India Post, etc.) must implement.
 */

export class BaseShippingProvider {
  constructor(providerCode, providerConfig = {}) {
    if (new.target === BaseShippingProvider) {
      throw new TypeError('Cannot construct BaseShippingProvider instances directly.');
    }
    this.providerCode = providerCode;
    this.providerConfig = providerConfig;
  }

  /**
   * Authenticate with the provider API and manage tokens/sessions.
   * @returns {Promise<{ token: string, expiresAt: Date }>}
   */
  async authenticate() {
    throw new Error('Method authenticate() must be implemented.');
  }

  /**
   * Check whether a route between pickup and delivery PIN codes is serviceable.
   *
   * @param {object} params
   * @param {string} params.pickupPincode
   * @param {string} params.deliveryPincode
   * @param {number} params.weight - In kg
   * @param {boolean} [params.cod=false]
   * @returns {Promise<{ serviceable: boolean, availableCourierCount: number, couriers: NormalizedCourierRate[] }>}
   */
  async checkServiceability(params) {
    throw new Error('Method checkServiceability() must be implemented.');
  }

  /**
   * Calculate shipping rate for a package across available courier options.
   *
   * @param {object} params
   * @param {string} params.pickupPincode
   * @param {string} params.deliveryPincode
   * @param {number} params.weight
   * @param {object} [params.dimensions] - { length, breadth, height }
   * @param {boolean} [params.cod=false]
   * @param {number} [params.declaredValue]
   * @returns {Promise<NormalizedCourierRate[]>}
   */
  async calculateShippingRate(params) {
    throw new Error('Method calculateShippingRate() must be implemented.');
  }

  /**
   * Retrieve list of serviceable couriers with rates and turnaround estimations.
   *
   * @param {object} params
   * @returns {Promise<NormalizedCourierRate[]>}
   */
  async getAvailableCouriers(params) {
    return this.calculateShippingRate(params);
  }

  /**
   * Create an adhoc shipment or order in the provider system.
   *
   * @param {object} params
   * @param {object} params.order - Internal order entity
   * @param {object} params.shippingAddress - Destination address snapshot
   * @param {Array} params.items - Order items
   * @param {object} params.packageDetails - { weight, length, breadth, height }
   * @param {object} params.pickupDetails - Pickup warehouse information
   * @param {boolean} params.isCod - Whether cash on delivery
   * @param {number} [params.courierCompanyId] - Pre-selected courier ID
   * @returns {Promise<NormalizedShipmentResult>}
   */
  async createShipment(params) {
    throw new Error('Method createShipment() must be implemented.');
  }

  /**
   * Generate and assign an Airway Bill (AWB) or tracking number.
   *
   * @param {object} params
   * @param {string} params.providerShipmentId
   * @param {number} [params.courierCompanyId]
   * @returns {Promise<NormalizedAwbResult>}
   */
  async generateAwb(params) {
    throw new Error('Method generateAwb() must be implemented.');
  }

  /**
   * Generate printable shipping label for assigned shipment/AWB.
   *
   * @param {object} params
   * @param {string} params.providerShipmentId
   * @param {string} [params.awbCode]
   * @returns {Promise<NormalizedLabelResult>}
   */
  async generateShippingLabel(params) {
    throw new Error('Method generateShippingLabel() must be implemented.');
  }

  /**
   * Request courier pickup from the warehouse.
   *
   * @param {object} params
   * @param {string} params.providerShipmentId
   * @param {Date|string} [params.pickupDate]
   * @returns {Promise<NormalizedPickupResult>}
   */
  async requestPickup(params) {
    throw new Error('Method requestPickup() must be implemented.');
  }

  /**
   * Query real-time tracking events for an AWB/shipment.
   *
   * @param {object} params
   * @param {string} params.awbCode
   * @param {string} [params.providerShipmentId]
   * @returns {Promise<NormalizedTrackingResult>}
   */
  async trackShipment(params) {
    throw new Error('Method trackShipment() must be implemented.');
  }

  /**
   * Cancel a shipment with the provider before it has been dispatched.
   *
   * @param {object} params
   * @param {string} params.providerOrderId
   * @param {string} [params.awbCode]
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async cancelShipment(params) {
    throw new Error('Method cancelShipment() must be implemented.');
  }
}
