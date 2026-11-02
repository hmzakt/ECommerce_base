import { prisma } from '../../../prisma/client.js';

export const shippingProviderRepository = {
  /**
   * List all configured providers (sanitizes cipher before returning).
   */
  findAll: async () => {
    const providers = await prisma.shippingProvider.findMany({
      orderBy: { name: 'asc' },
    });

    return providers.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      providerType: p.providerType,
      isActive: p.isActive,
      environment: p.environment,
      hasCredentials: Boolean(p.credentialsCipher),
      config: p.config,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  },

  /**
   * Find provider by its code (e.g. SHIPROCKET).
   */
  findByCode: async (code) => {
    return prisma.shippingProvider.findUnique({
      where: { code: code.toUpperCase() },
    });
  },

  /**
   * Find provider by ID.
   */
  findById: async (id) => {
    return prisma.shippingProvider.findUnique({
      where: { id },
    });
  },

  /**
   * Update provider settings/credentials.
   */
  update: async (id, data) => {
    return prisma.shippingProvider.update({
      where: { id },
      data,
    });
  },
};
