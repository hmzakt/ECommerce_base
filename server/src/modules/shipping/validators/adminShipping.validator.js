import { z } from 'zod';

export const listShipmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum([
      'PENDING', 'PROCESSING', 'SHIPMENT_CREATED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED',
      'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED',
      'RTO_INITIATED', 'RTO_DELIVERED', 'CANCELLED', 'EXCEPTION',
    ]).optional(),
    search: z.string().trim().optional(),
    fromDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    toDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  }),
});

export const createShipmentSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    overrideCourierId: z.union([z.string(), z.number()]).optional(),
  }).optional(),
});

export const shipmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shipment ID'),
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});

export const cancelShipmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shipment ID'),
  }),
  body: z.object({
    reason: z.string().min(3).max(500).default('Cancelled by administrator'),
  }).optional(),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    autoCreateShipment: z.boolean().optional(),
    defaultProviderCode: z.string().min(2).optional(),
    courierSelectionStrategy: z.enum(['CHEAPEST', 'FASTEST', 'BALANCED']).optional(),
    strategyWeights: z.object({
      cost: z.number().min(0).max(1).optional(),
      speed: z.number().min(0).max(1).optional(),
      rating: z.number().min(0).max(1).optional(),
    }).optional(),
    allowedCouriers: z.array(z.union([z.string(), z.number()])).optional(),
    freeShippingThreshold: z.number().min(0).optional(),
    warehouseAddress: z.object({
      name: z.string().min(2),
      company: z.string().optional(),
      phone: z.string().min(10),
      email: z.string().email().optional(),
      addressLine1: z.string().min(5),
      addressLine2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().regex(/^\d{6}$/, 'PIN code must be a 6-digit Indian postal code'),
      country: z.string().default('India'),
    }).optional(),
    defaultPackageWeight: z.number().positive().optional(),
    defaultPackageDimensions: z.object({
      length: z.number().positive(),
      breadth: z.number().positive(),
      height: z.number().positive(),
    }).optional(),
    retryPolicy: z.object({
      maxRetries: z.number().int().min(1).max(10).optional(),
      backoffBaseMs: z.number().int().positive().optional(),
      backoffMaxMs: z.number().int().positive().optional(),
    }).optional(),
  }),
});

export const updateProviderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid provider ID'),
  }),
  body: z.object({
    isActive: z.boolean().optional(),
    environment: z.enum(['SANDBOX', 'PRODUCTION']).optional(),
    credentials: z.object({
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
      apiToken: z.string().optional(),
    }).optional(),
    config: z.record(z.any()).optional(),
  }),
});
