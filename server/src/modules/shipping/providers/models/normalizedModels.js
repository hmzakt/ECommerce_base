/**
 * Normalized domain models for shipping provider responses.
 * Guarantees that upstream business logic (order processing, courier selection, admin APIs)
 * never depends directly on provider-specific response payloads.
 */

export class NormalizedCourierRate {
  constructor({
    courierCompanyId,
    courierName,
    rate,
    estimatedDeliveryDays,
    estimatedDeliveryDate,
    rating = null,
    isCodAvailable = false,
    cutoffTime = null,
    trackingPerformance = null,
    raw = null,
  }) {
    this.courierCompanyId = courierCompanyId;
    this.courierName = courierName;
    this.rate = Number(rate);
    this.estimatedDeliveryDays = estimatedDeliveryDays !== undefined && estimatedDeliveryDays !== null ? Number(estimatedDeliveryDays) : null;
    this.estimatedDeliveryDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null;
    this.rating = rating !== null ? Number(rating) : null;
    this.isCodAvailable = Boolean(isCodAvailable);
    this.cutoffTime = cutoffTime;
    this.trackingPerformance = trackingPerformance;
    this.raw = raw;
  }
}

export class NormalizedShipmentResult {
  constructor({
    providerShipmentId,
    providerOrderId,
    status,
    courierCompanyId = null,
    courierName = null,
    shippingCost = 0.0,
    awbCode = null,
    labelUrl = null,
    raw = null,
  }) {
    this.providerShipmentId = String(providerShipmentId);
    this.providerOrderId = providerOrderId ? String(providerOrderId) : null;
    this.status = status;
    this.courierCompanyId = courierCompanyId ? Number(courierCompanyId) : null;
    this.courierName = courierName;
    this.shippingCost = Number(shippingCost);
    this.awbCode = awbCode;
    this.labelUrl = labelUrl;
    this.raw = raw;
  }
}

export class NormalizedAwbResult {
  constructor({
    awbCode,
    courierCompanyId,
    courierName,
    trackingUrl = null,
    raw = null,
  }) {
    this.awbCode = String(awbCode);
    this.courierCompanyId = courierCompanyId ? Number(courierCompanyId) : null;
    this.courierName = courierName;
    this.trackingUrl = trackingUrl;
    this.raw = raw;
  }
}

export class NormalizedLabelResult {
  constructor({
    labelUrl,
    invoiceUrl = null,
    manifestUrl = null,
    raw = null,
  }) {
    this.labelUrl = labelUrl;
    this.invoiceUrl = invoiceUrl;
    this.manifestUrl = manifestUrl;
    this.raw = raw;
  }
}

export class NormalizedPickupResult {
  constructor({
    pickupToken,
    pickupDate,
    status = 'REQUESTED',
    raw = null,
  }) {
    this.pickupToken = String(pickupToken);
    this.pickupDate = pickupDate ? new Date(pickupDate) : null;
    this.status = status;
    this.raw = raw;
  }
}

export class NormalizedTrackingEvent {
  constructor({
    eventCode,
    status,
    description,
    location = null,
    timestamp,
    externalEventId = null,
    raw = null,
  }) {
    this.eventCode = eventCode;
    this.status = status;
    this.description = description;
    this.location = location;
    this.timestamp = timestamp ? new Date(timestamp) : new Date();
    this.externalEventId = externalEventId;
    this.raw = raw;
  }
}

export class NormalizedTrackingResult {
  constructor({
    awbCode,
    currentStatus,
    currentLocation = null,
    estimatedDelivery = null,
    events = [],
    isDelivered = false,
    raw = null,
  }) {
    this.awbCode = String(awbCode);
    this.currentStatus = currentStatus;
    this.currentLocation = currentLocation;
    this.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : null;
    this.events = events;
    this.isDelivered = Boolean(isDelivered);
    this.raw = raw;
  }
}
