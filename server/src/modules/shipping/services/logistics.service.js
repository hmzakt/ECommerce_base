import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../prisma/client.js';
import { shipmentRepository } from '../repositories/shipment.repository.js';
import { shippingSettingsRepository } from '../repositories/shippingSettings.repository.js';
import { shippingProviderRepository } from '../repositories/shippingProvider.repository.js';
import { ShippingProviderFactory } from '../providers/provider.factory.js';
import { CourierSelectionService } from '../engine/courierSelection.service.js';
import { orderRepository } from '../../orders/repositories/order.repository.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';
import { logger } from '../../../common/logger/index.js';

export const logisticsService = {
  /**
   * Calculate total package weight and dimensions from order items,
   * falling back to configured system defaults where product data is absent.
   */
  calculatePackageMetrics: (order, settings) => {
    let totalWeight = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;

    const defaultWeight = Number(settings.defaultPackageWeight || 0.5);
    const defaultDims = settings.defaultPackageDimensions || { length: 20, breadth: 15, height: 10 };

    for (const item of (order.items || [])) {
      const product = item.product || {};
      const qty = item.quantity || 1;

      const itemWeight = product.weight ? Number(product.weight) : defaultWeight;
      totalWeight += itemWeight * qty;

      const itemLength = product.length ? Number(product.length) : defaultDims.length;
      const itemBreadth = product.breadth ? Number(product.breadth) : defaultDims.breadth;
      const itemHeight = product.height ? Number(product.height) : (defaultDims.height / (order.items.length || 1));

      maxLength = Math.max(maxLength, itemLength);
      maxBreadth = Math.max(maxBreadth, itemBreadth);
      totalHeight += itemHeight * qty;
    }

    if (totalWeight <= 0) totalWeight = defaultWeight;
    if (maxLength <= 0) maxLength = defaultDims.length;
    if (maxBreadth <= 0) maxBreadth = defaultDims.breadth;
    if (totalHeight <= 0) totalHeight = defaultDims.height;

    return {
      weight: Number(totalWeight.toFixed(3)),
      length: Number(maxLength.toFixed(2)),
      breadth: Number(maxBreadth.toFixed(2)),
      height: Number(totalHeight.toFixed(2)),
    };
  },

  /**
   * Check available couriers and rates for an order.
   */
  getCourierOptionsForOrder: async (orderId) => {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found', ErrorCodes.ORDER_NOT_FOUND);
    }

    if (!order.shippingAddress || !order.shippingAddress.postalCode) {
      throw AppError.badRequest('Order is missing destination postal code.', ErrorCodes.VALIDATION_ERROR);
    }

    const settings = await shippingSettingsRepository.getSettings();
    const provider = ShippingProviderFactory.getProvider(settings.defaultProviderCode);
    const packageMetrics = logisticsService.calculatePackageMetrics(order, settings);

    const isCod = order.paymentStatus !== 'PAID';
    const pickupPincode = settings.warehouseAddress?.pincode || '122015';

    const serviceability = await provider.checkServiceability({
      pickupPincode,
      deliveryPincode: order.shippingAddress.postalCode,
      weight: packageMetrics.weight,
      cod: isCod,
      dimensions: packageMetrics,
      declaredValue: Number(order.total),
    });

    // Run selection algorithm to recommend the best option
    let recommendation = null;
    if (serviceability.couriers.length > 0) {
      recommendation = CourierSelectionService.selectCourier(serviceability.couriers, {
        strategy: settings.courierSelectionStrategy,
        weights: settings.strategyWeights,
        isCod,
        allowedCouriers: settings.allowedCouriers,
      });
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      serviceable: serviceability.serviceable,
      packageMetrics,
      isCod,
      recommendation,
      availableCouriers: serviceability.couriers,
    };
  },

  /**
   * Process and create shipment for an eligible confirmed order.
   * Completely idempotent: Reconciles active shipments before initiating provider API calls.
   */
  processOrderShipment: async (orderId, options = {}) => {
    const correlationId = options.correlationId || uuidv4();
    const overrideCourierId = options.overrideCourierId || null;

    logger.info({ orderId, correlationId }, 'Starting shipment processing for order');

    // 1. Fetch order with complete details
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw AppError.notFound(`Order ${orderId} not found.`, ErrorCodes.ORDER_NOT_FOUND);
    }

    // 2. Validate Order Lifecycle: Must be eligible for shipment
    const isPrepaidPaid = order.paymentStatus === 'PAID';
    const isCodConfirmed = order.paymentStatus !== 'PAID' && ['CONFIRMED', 'PROCESSING'].includes(order.status);

    if (!isPrepaidPaid && !isCodConfirmed) {
      logger.warn(
        { orderId, status: order.status, paymentStatus: order.paymentStatus },
        'Order is not eligible for shipment creation (must be PAID or CONFIRMED COD)'
      );
      return null;
    }

    // 3. Idempotency Check: Prevent duplicate active shipments
    const existingActiveShipment = await shipmentRepository.findActiveByOrderId(orderId);
    if (existingActiveShipment && existingActiveShipment.status !== 'PENDING') {
      logger.info(
        { orderId, shipmentId: existingActiveShipment.id, awb: existingActiveShipment.awbCode },
        'Active shipment already exists for order (idempotent skip)'
      );
      return existingActiveShipment;
    }

    // 4. Validate shipping address
    const shippingAddress = order.shippingAddress;
    if (!shippingAddress || !shippingAddress.postalCode) {
      const err = new Error('Shipping address is missing destination postal code.');
      await shipmentRepository.recordAttempt({
        orderId,
        provider: 'SYSTEM',
        operation: 'VALIDATE_ADDRESS',
        correlationId,
        status: 'FAILED',
        errorCode: ErrorCodes.VALIDATION_ERROR,
        errorMessage: err.message,
      });
      throw err;
    }

    // 5. Fetch Shipping Configuration & Provider
    const settings = await shippingSettingsRepository.getSettings();
    const providerCode = settings.defaultProviderCode || 'SHIPROCKET';
    const provider = ShippingProviderFactory.getProvider(providerCode);

    const packageMetrics = logisticsService.calculatePackageMetrics(order, settings);
    const isCod = order.paymentStatus !== 'PAID';
    const pickupPincode = settings.warehouseAddress?.pincode || '122015';

    // 6. Courier Serviceability & Selection
    let serviceabilityResult;
    try {
      serviceabilityResult = await provider.checkServiceability({
        pickupPincode,
        deliveryPincode: shippingAddress.postalCode,
        weight: packageMetrics.weight,
        cod: isCod,
        dimensions: packageMetrics,
        declaredValue: Number(order.total),
      });
    } catch (err) {
      await shipmentRepository.recordAttempt({
        orderId,
        provider: providerCode,
        operation: 'CHECK_SERVICEABILITY',
        correlationId,
        status: 'FAILED',
        errorCode: 'SERVICEABILITY_ERROR',
        errorMessage: err.message,
      });
      throw err;
    }

    if (!serviceabilityResult.serviceable || serviceabilityResult.couriers.length === 0) {
      const err = new Error(`No serviceable courier available from ${pickupPincode} to ${shippingAddress.postalCode}.`);
      await shipmentRepository.recordAttempt({
        orderId,
        provider: providerCode,
        operation: 'SELECT_COURIER',
        correlationId,
        status: 'FAILED',
        errorCode: ErrorCodes.SHIPPING_NO_SERVICEABLE_COURIER,
        errorMessage: err.message,
      });
      throw err;
    }

    const { selectedCourier, selectionReason } = CourierSelectionService.selectCourier(
      serviceabilityResult.couriers,
      {
        strategy: settings.courierSelectionStrategy,
        weights: settings.strategyWeights,
        overrideCourierId,
        isCod,
        allowedCouriers: settings.allowedCouriers,
      }
    );

    // 7. Initialize or reuse Shipment in DB
    let shipment = existingActiveShipment;
    if (!shipment) {
      shipment = await shipmentRepository.createShipment({
        orderId: order.id,
        shippingProvider: providerCode,
        courierName: selectedCourier.courierName,
        courierCompanyId: selectedCourier.courierCompanyId,
        status: 'PROCESSING',
        shippingCost: selectedCourier.rate,
        currency: 'INR',
        weight: packageMetrics.weight,
        length: packageMetrics.length,
        breadth: packageMetrics.breadth,
        height: packageMetrics.height,
        pickupLocation: settings.warehouseAddress?.name || 'Primary Fulfillment Center',
        destinationSnapshot: shippingAddress,
        estimatedDelivery: selectedCourier.estimatedDeliveryDate,
        selectionStrategy: settings.courierSelectionStrategy,
        selectionReason,
      });
    }

    // 8. Call Provider: Create Shipment/Order
    let shipmentResult;
    try {
      shipmentResult = await provider.createShipment({
        order,
        shippingAddress,
        items: order.items,
        packageDetails: packageMetrics,
        pickupDetails: { pickupLocation: shipment.pickupLocation },
        isCod,
        courierCompanyId: selectedCourier.courierCompanyId,
      });

      await shipmentRepository.recordAttempt({
        orderId,
        shipmentId: shipment.id,
        provider: providerCode,
        operation: 'CREATE_SHIPMENT',
        correlationId,
        status: 'SUCCESS',
        responsePayload: { externalShipmentId: shipmentResult.providerShipmentId },
      });
    } catch (err) {
      await shipmentRepository.recordAttempt({
        orderId,
        shipmentId: shipment.id,
        provider: providerCode,
        operation: 'CREATE_SHIPMENT',
        correlationId,
        status: 'FAILED',
        errorMessage: err.message,
      });
      throw err;
    }

    // Update shipment with external identifiers
    shipment = await shipmentRepository.updateShipment(shipment.id, {
      externalShipmentId: shipmentResult.providerShipmentId,
      externalOrderId: shipmentResult.providerOrderId,
      status: 'SHIPMENT_CREATED',
    });

    await shipmentRepository.recordEvent({
      shipmentId: shipment.id,
      eventCode: 'SHIPMENT_CREATED',
      eventStatus: 'SHIPMENT_CREATED',
      eventDescription: `Shipment registered with ${selectedCourier.courierName} (${providerCode}). External ID: ${shipmentResult.providerShipmentId}`,
      eventLocation: shipment.pickupLocation,
      eventSource: providerCode,
      externalEventId: `${shipmentResult.providerShipmentId}-CREATED`,
    });

    // 9. Call Provider: Generate & Assign AWB
    let awbResult;
    try {
      awbResult = await provider.generateAwb({
        providerShipmentId: shipmentResult.providerShipmentId,
        courierCompanyId: selectedCourier.courierCompanyId,
      });

      shipment = await shipmentRepository.updateShipment(shipment.id, {
        awbCode: awbResult.awbCode,
        courierName: awbResult.courierName || shipment.courierName,
        trackingUrl: awbResult.trackingUrl,
        status: 'AWB_ASSIGNED',
      });

      await shipmentRepository.recordAttempt({
        orderId,
        shipmentId: shipment.id,
        provider: providerCode,
        operation: 'GENERATE_AWB',
        correlationId,
        status: 'SUCCESS',
        responsePayload: { awbCode: awbResult.awbCode },
      });

      await shipmentRepository.recordEvent({
        shipmentId: shipment.id,
        eventCode: 'AWB_ASSIGNED',
        eventStatus: 'AWB_ASSIGNED',
        eventDescription: `AWB ${awbResult.awbCode} assigned by courier`,
        eventSource: providerCode,
        externalEventId: `${awbResult.awbCode}-ASSIGNED`,
      });
    } catch (err) {
      logger.error({ err: err.message, shipmentId: shipment.id }, 'AWB assignment failed');
      await shipmentRepository.recordAttempt({
        orderId,
        shipmentId: shipment.id,
        provider: providerCode,
        operation: 'GENERATE_AWB',
        correlationId,
        status: 'FAILED',
        errorMessage: err.message,
      });
      // Do not abort entirely if AWB is pending manual provider approval
    }

    // 10. Call Provider: Generate Shipping Label
    try {
      const labelResult = await provider.generateShippingLabel({
        providerShipmentId: shipmentResult.providerShipmentId,
        awbCode: shipment.awbCode,
      });

      if (labelResult?.labelUrl) {
        shipment = await shipmentRepository.updateShipment(shipment.id, {
          labelUrl: labelResult.labelUrl,
          manifestUrl: labelResult.manifestUrl,
          invoiceUrl: labelResult.invoiceUrl,
        });

        await shipmentRepository.recordAttempt({
          orderId,
          shipmentId: shipment.id,
          provider: providerCode,
          operation: 'GENERATE_LABEL',
          correlationId,
          status: 'SUCCESS',
          responsePayload: { labelUrl: labelResult.labelUrl },
        });
      }
    } catch (err) {
      logger.warn({ err: err.message, shipmentId: shipment.id }, 'Non-fatal label generation failure');
    }

    // 11. Call Provider: Schedule Courier Pickup
    try {
      const pickupResult = await provider.requestPickup({
        providerShipmentId: shipmentResult.providerShipmentId,
        pickupDate: new Date(),
      });

      if (pickupResult?.pickupToken) {
        shipment = await shipmentRepository.updateShipment(shipment.id, {
          pickupRequestId: pickupResult.pickupToken,
          pickupScheduledDate: pickupResult.pickupDate,
          status: 'PICKUP_REQUESTED',
        });

        await shipmentRepository.recordAttempt({
          orderId,
          shipmentId: shipment.id,
          provider: providerCode,
          operation: 'REQUEST_PICKUP',
          correlationId,
          status: 'SUCCESS',
          responsePayload: { pickupToken: pickupResult.pickupToken },
        });

        await shipmentRepository.recordEvent({
          shipmentId: shipment.id,
          eventCode: 'PICKUP_REQUESTED',
          eventStatus: 'PICKUP_REQUESTED',
          eventDescription: `Courier pickup scheduled (Token: ${pickupResult.pickupToken})`,
          eventSource: providerCode,
          externalEventId: `${pickupResult.pickupToken}-PICKUP`,
        });
      }
    } catch (err) {
      logger.warn({ err: err.message, shipmentId: shipment.id }, 'Non-fatal pickup request failure');
    }

    // 12. Update Order status to SHIPPED and sync legacy shipping table for backward compatibility
    await prisma.shipping.upsert({
      where: { orderId: order.id },
      update: {
        trackingNumber: shipment.awbCode || shipment.externalShipmentId,
        shippingProvider: `${shipment.courierName || providerCode}`,
        estimatedDelivery: shipment.estimatedDelivery,
        status: 'SHIPPED',
      },
      create: {
        orderId: order.id,
        trackingNumber: shipment.awbCode || shipment.externalShipmentId,
        shippingProvider: `${shipment.courierName || providerCode}`,
        estimatedDelivery: shipment.estimatedDelivery,
        status: 'SHIPPED',
      },
    });

    await orderRepository.updateOrderStatus(order.id, {
      status: 'SHIPPED',
    });

    logger.info(
      { orderId, shipmentId: shipment.id, awb: shipment.awbCode, courier: shipment.courierName },
      'Shipment successfully created, AWB assigned, and order updated'
    );

    return shipmentRepository.findById(shipment.id);
  },

  /**
   * Refresh and sync real-time tracking events from provider.
   */
  syncTracking: async (shipmentId) => {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) {
      throw AppError.notFound('Shipment not found', ErrorCodes.NOT_FOUND);
    }

    if (!shipment.awbCode) {
      throw AppError.badRequest('Shipment does not have an assigned AWB code.', ErrorCodes.BAD_REQUEST);
    }

    const provider = ShippingProviderFactory.getProvider(shipment.shippingProvider);
    const tracking = await provider.trackShipment({
      awbCode: shipment.awbCode,
      providerShipmentId: shipment.externalShipmentId,
    });

    // Record each new event idempotently
    for (const evt of tracking.events) {
      await shipmentRepository.recordEvent({
        shipmentId: shipment.id,
        eventCode: evt.eventCode,
        eventStatus: evt.status,
        eventDescription: evt.description,
        eventLocation: evt.location,
        eventTimestamp: evt.timestamp,
        eventSource: shipment.shippingProvider,
        externalEventId: evt.externalEventId,
        rawPayload: evt.raw,
      });
    }

    // Update shipment status if delivered or changed
    const updatePayload = {};
    if (tracking.isDelivered && shipment.status !== 'DELIVERED') {
      updatePayload.status = 'DELIVERED';
      updatePayload.actualDelivery = new Date();
      await orderRepository.updateOrderStatus(shipment.orderId, { status: 'DELIVERED' });
    } else if (tracking.currentStatus && tracking.currentStatus !== shipment.status) {
      // Map provider status to internal enum safely
      const validStatuses = [
        'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RTO_INITIATED', 'RTO_DELIVERED'
      ];
      if (validStatuses.includes(tracking.currentStatus)) {
        updatePayload.status = tracking.currentStatus;
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await shipmentRepository.updateShipment(shipment.id, updatePayload);
    }

    return shipmentRepository.findById(shipment.id);
  },

  /**
   * Cancel an eligible shipment.
   */
  cancelShipment: async (shipmentId, reason = 'Cancelled by administrator') => {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) {
      throw AppError.notFound('Shipment not found', ErrorCodes.NOT_FOUND);
    }

    if (['DELIVERED', 'CANCELLED', 'RTO_DELIVERED'].includes(shipment.status)) {
      throw AppError.badRequest(
        `Shipment with status "${shipment.status}" cannot be cancelled.`,
        ErrorCodes.BAD_REQUEST
      );
    }

    const provider = ShippingProviderFactory.getProvider(shipment.shippingProvider);

    if (shipment.externalOrderId) {
      try {
        await provider.cancelShipment({
          providerOrderId: shipment.externalOrderId,
          awbCode: shipment.awbCode,
        });
      } catch (err) {
        logger.warn({ err: err.message, shipmentId }, 'Provider shipment cancellation call failed; updating local status');
      }
    }

    const updated = await shipmentRepository.updateShipment(shipment.id, {
      status: 'CANCELLED',
      isActive: false,
    });

    await shipmentRepository.recordEvent({
      shipmentId: shipment.id,
      eventCode: 'CANCELLED',
      eventStatus: 'CANCELLED',
      eventDescription: `Shipment cancelled: ${reason}`,
      eventSource: 'ADMIN',
      externalEventId: `${shipment.id}-CANCELLED-${Date.now()}`,
    });

    return updated;
  },
};
