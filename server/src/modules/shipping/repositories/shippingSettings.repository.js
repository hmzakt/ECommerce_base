import { prisma } from '../../../prisma/client.js';

export const shippingSettingsRepository = {
  /**
   * Retrieve current active shipping settings.
   */
  getSettings: async () => {
    let settings = await prisma.shippingSettings.findFirst();
    if (!settings) {
      // Create defaults on-the-fly if missing
      settings = await prisma.shippingSettings.create({
        data: {
          autoCreateShipment: true,
          defaultProviderCode: 'SHIPROCKET',
          courierSelectionStrategy: 'BALANCED',
          strategyWeights: { cost: 0.4, speed: 0.4, rating: 0.2 },
          allowedCouriers: ['all'],
          freeShippingThreshold: 1000.0,
          warehouseAddress: {
            name: 'Primary Fulfillment Center',
            company: 'Maison Luxury Living',
            phone: '9876543210',
            addressLine1: 'Plot 42, Udyog Vihar Phase 4',
            city: 'Gurugram',
            state: 'Haryana',
            pincode: '122015',
            country: 'India',
          },
          defaultPackageWeight: 0.500,
          defaultPackageDimensions: { length: 20, breadth: 15, height: 10 },
          retryPolicy: { maxRetries: 5, backoffBaseMs: 3000, backoffMaxMs: 60000 },
        },
      });
    }
    return settings;
  },

  /**
   * Update shipping settings.
   */
  updateSettings: async (updateData) => {
    const current = await shippingSettingsRepository.getSettings();
    return prisma.shippingSettings.update({
      where: { id: current.id },
      data: updateData,
    });
  },
};
