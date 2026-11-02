import { shipmentRepository } from '../repositories/shipment.repository.js';
import { shippingSettingsRepository } from '../repositories/shippingSettings.repository.js';
import { shippingProviderRepository } from '../repositories/shippingProvider.repository.js';
import { logisticsService } from '../services/logistics.service.js';
import { ShippingProviderFactory } from '../providers/provider.factory.js';
import { sendSuccess } from '../../../common/utils/response.js';
import { buildPaginationMeta } from '../../../common/utils/response.js';
import { encryptData } from '../../../common/utils/crypto.js';
import { AppError } from '../../../common/errors/AppError.js';
import { ErrorCodes } from '../../../common/errors/errorCodes.js';

export const adminShippingController = {
  /**
   * GET /admin/shipping/shipments
   * List paginated shipments with status, search, and date filters.
   */
  getShipments: async (req, res) => {
    const { page = 1, limit = 20, status, search, fromDate, toDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [shipments, total] = await Promise.all([
      shipmentRepository.findMany({
        skip,
        take: Number(limit),
        status,
        search,
        fromDate,
        toDate,
      }),
      shipmentRepository.countMany({ status, search, fromDate, toDate }),
    ]);

    sendSuccess(res, {
      message: 'Shipments retrieved successfully',
      data: { shipments },
      meta: buildPaginationMeta({ total, page: Number(page), limit: Number(limit) }),
    });
  },

  /**
   * GET /admin/shipping/shipments/:id
   * Get detailed shipment records with tracking event history and attempts.
   */
  getShipmentById: async (req, res) => {
    const shipment = await shipmentRepository.findById(req.params.id);
    if (!shipment) {
      throw AppError.notFound('Shipment not found', ErrorCodes.NOT_FOUND);
    }

    sendSuccess(res, {
      message: 'Shipment details retrieved successfully',
      data: { shipment },
    });
  },

  /**
   * GET /admin/shipping/orders/:orderId/courier-options
   * Live rate card and courier serviceability check for an order.
   */
  getCourierOptions: async (req, res) => {
    const options = await logisticsService.getCourierOptionsForOrder(req.params.orderId);

    sendSuccess(res, {
      message: 'Courier serviceability and quotes retrieved successfully',
      data: options,
    });
  },

  /**
   * POST /admin/shipping/orders/:orderId/create-shipment
   * Manual shipment creation or reprocessing with optional courier override.
   */
  createShipment: async (req, res) => {
    const shipment = await logisticsService.processOrderShipment(req.params.orderId, {
      overrideCourierId: req.body?.overrideCourierId,
      correlationId: `admin-trigger-${Date.now()}`,
    });

    sendSuccess(res, {
      message: 'Shipment processing completed successfully',
      data: { shipment },
      statusCode: 201,
    });
  },

  /**
   * POST /admin/shipping/shipments/:id/assign-awb
   * Manually request or assign AWB for an existing shipment.
   */
  assignAwb: async (req, res) => {
    const shipment = await shipmentRepository.findById(req.params.id);
    if (!shipment) {
      throw AppError.notFound('Shipment not found', ErrorCodes.NOT_FOUND);
    }

    if (!shipment.externalShipmentId) {
      throw AppError.badRequest('Shipment has not been registered with external provider.', ErrorCodes.BAD_REQUEST);
    }

    const provider = ShippingProviderFactory.getProvider(shipment.shippingProvider);
    const awbResult = await provider.generateAwb({
      providerShipmentId: shipment.externalShipmentId,
      courierCompanyId: shipment.courierCompanyId,
    });

    const updated = await shipmentRepository.updateShipment(shipment.id, {
      awbCode: awbResult.awbCode,
      trackingUrl: awbResult.trackingUrl,
      status: 'AWB_ASSIGNED',
    });

    await shipmentRepository.recordEvent({
      shipmentId: shipment.id,
      eventCode: 'AWB_ASSIGNED',
      eventStatus: 'AWB_ASSIGNED',
      eventDescription: `AWB ${awbResult.awbCode} manually assigned by Admin`,
      eventSource: 'ADMIN',
      externalEventId: `${awbResult.awbCode}-ADMIN-ASSIGN`,
    });

    sendSuccess(res, {
      message: 'AWB assigned successfully',
      data: { shipment: updated },
    });
  },

  /**
   * POST /admin/shipping/shipments/:id/request-pickup
   * Request warehouse courier pickup.
   */
  requestPickup: async (req, res) => {
    const shipment = await shipmentRepository.findById(req.params.id);
    if (!shipment) {
      throw AppError.notFound('Shipment not found', ErrorCodes.NOT_FOUND);
    }

    const provider = ShippingProviderFactory.getProvider(shipment.shippingProvider);
    const pickupResult = await provider.requestPickup({
      providerShipmentId: shipment.externalShipmentId,
      pickupDate: req.body?.pickupDate || new Date(),
    });

    const updated = await shipmentRepository.updateShipment(shipment.id, {
      pickupRequestId: pickupResult.pickupToken,
      pickupScheduledDate: pickupResult.pickupDate,
      status: 'PICKUP_REQUESTED',
    });

    await shipmentRepository.recordEvent({
      shipmentId: shipment.id,
      eventCode: 'PICKUP_REQUESTED',
      eventStatus: 'PICKUP_REQUESTED',
      eventDescription: `Pickup scheduled by Admin. Token: ${pickupResult.pickupToken}`,
      eventSource: 'ADMIN',
      externalEventId: `${pickupResult.pickupToken}-ADMIN-PICKUP`,
    });

    sendSuccess(res, {
      message: 'Courier pickup scheduled successfully',
      data: { shipment: updated },
    });
  },

  /**
   * GET /admin/shipping/shipments/:id/label
   * Retrieve or generate printable shipping label.
   */
  getShippingLabel: async (req, res) => {
    const shipment = await shipmentRepository.findById(req.params.id);
    if (!shipment) {
      throw AppError.notFound('Shipment not found', ErrorCodes.NOT_FOUND);
    }

    let labelUrl = shipment.labelUrl;

    if (!labelUrl && shipment.externalShipmentId) {
      const provider = ShippingProviderFactory.getProvider(shipment.shippingProvider);
      const labelResult = await provider.generateShippingLabel({
        providerShipmentId: shipment.externalShipmentId,
        awbCode: shipment.awbCode,
      });

      if (labelResult.labelUrl) {
        labelUrl = labelResult.labelUrl;
        await shipmentRepository.updateShipment(shipment.id, {
          labelUrl: labelResult.labelUrl,
          manifestUrl: labelResult.manifestUrl,
          invoiceUrl: labelResult.invoiceUrl,
        });
      }
    }

    sendSuccess(res, {
      message: 'Shipping label retrieved successfully',
      data: {
        shipmentId: shipment.id,
        awbCode: shipment.awbCode,
        labelUrl,
        manifestUrl: shipment.manifestUrl,
        invoiceUrl: shipment.invoiceUrl,
      },
    });
  },

  /**
   * POST /admin/shipping/shipments/:id/cancel
   * Cancel an eligible active shipment.
   */
  cancelShipment: async (req, res) => {
    const reason = req.body?.reason || 'Cancelled by administrator';
    const updated = await logisticsService.cancelShipment(req.params.id, reason);

    sendSuccess(res, {
      message: 'Shipment cancelled successfully',
      data: { shipment: updated },
    });
  },

  /**
   * POST /admin/shipping/shipments/:id/sync-tracking
   * Pull live tracking milestones from courier provider.
   */
  syncTracking: async (req, res) => {
    const shipment = await logisticsService.syncTracking(req.params.id);

    sendSuccess(res, {
      message: 'Tracking history synchronized successfully',
      data: { shipment },
    });
  },

  /**
   * GET /admin/shipping/settings
   * Retrieve shipping logistics settings.
   */
  getSettings: async (req, res) => {
    const settings = await shippingSettingsRepository.getSettings();

    sendSuccess(res, {
      message: 'Shipping settings retrieved successfully',
      data: { settings },
    });
  },

  /**
   * PUT /admin/shipping/settings
   * Update shipping logistics settings.
   */
  updateSettings: async (req, res) => {
    const updated = await shippingSettingsRepository.updateSettings(req.body);

    sendSuccess(res, {
      message: 'Shipping settings updated successfully',
      data: { settings: updated },
    });
  },

  /**
   * GET /admin/shipping/providers
   * List all logistics provider integrations.
   */
  getProviders: async (req, res) => {
    const providers = await shippingProviderRepository.findAll();

    sendSuccess(res, {
      message: 'Shipping providers retrieved successfully',
      data: { providers },
    });
  },

  /**
   * PATCH /admin/shipping/providers/:id
   * Update provider configuration & encrypted credentials.
   */
  updateProvider: async (req, res) => {
    const { id } = req.params;
    const { isActive, environment, credentials, config } = req.body;

    const existing = await shippingProviderRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Shipping provider not found', ErrorCodes.NOT_FOUND);
    }

    const updateData = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (environment) updateData.environment = environment;
    if (config) updateData.config = config;

    // Encrypt credentials before persisting to DB
    if (credentials) {
      updateData.credentialsCipher = encryptData(credentials);
    }

    const updated = await shippingProviderRepository.update(id, updateData);

    sendSuccess(res, {
      message: 'Shipping provider updated successfully',
      data: {
        provider: {
          id: updated.id,
          code: updated.code,
          name: updated.name,
          isActive: updated.isActive,
          environment: updated.environment,
          hasCredentials: Boolean(updated.credentialsCipher),
          config: updated.config,
          updatedAt: updated.updatedAt,
        },
      },
    });
  },
};
