import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedLogistics() {
  console.log('Seeding Logistics Infrastructure...');

  // 1. Seed or update ShippingSettings
  const existingSettings = await prisma.shippingSettings.findFirst();
  if (!existingSettings) {
    await prisma.shippingSettings.create({
      data: {
        autoCreateShipment: true,
        defaultProviderCode: 'SHIPROCKET',
        courierSelectionStrategy: 'BALANCED',
        strategyWeights: {
          cost: 0.4,
          speed: 0.4,
          rating: 0.2,
        },
        allowedCouriers: ['all'],
        preferredCourierId: null,
        freeShippingThreshold: 1000.00,
        warehouseAddress: {
          name: 'Primary Fulfillment Center',
          company: 'Maison Luxury Living',
          phone: '9876543210',
          email: 'logistics@maison.internal',
          addressLine1: 'Plot 42, Udyog Vihar Phase 4',
          addressLine2: 'Sector 18',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122015',
          country: 'India',
        },
        defaultPackageWeight: 0.500,
        defaultPackageDimensions: {
          length: 20,
          breadth: 15,
          height: 10,
        },
        retryPolicy: {
          maxRetries: 5,
          backoffBaseMs: 3000,
          backoffMaxMs: 60000,
        },
      },
    });
    console.log('Created default ShippingSettings.');
  } else {
    console.log('ShippingSettings already exists. Skipping creation.');
  }

  // 2. Seed default Providers
  const providers = [
    {
      code: 'SHIPROCKET',
      name: 'Shiprocket Multi-Courier Aggregator',
      providerType: 'AGGREGATOR',
      isActive: true,
      environment: 'SANDBOX',
      config: {
        defaultPickupLocation: 'Primary Fulfillment Center',
        channelId: '',
      },
    },
    {
      code: 'DELHIVERY',
      name: 'Delhivery Direct API',
      providerType: 'DIRECT',
      isActive: false,
      environment: 'SANDBOX',
      config: {
        clientName: 'Maison Direct',
      },
    },
    {
      code: 'EKART',
      name: 'Ekart Logistics Direct',
      providerType: 'DIRECT',
      isActive: false,
      environment: 'SANDBOX',
      config: {},
    },
    {
      code: 'INDIAPOST',
      name: 'India Post Speed Post Direct',
      providerType: 'DIRECT',
      isActive: false,
      environment: 'SANDBOX',
      config: {},
    },
  ];

  for (const prov of providers) {
    await prisma.shippingProvider.upsert({
      where: { code: prov.code },
      update: {
        name: prov.name,
        providerType: prov.providerType,
      },
      create: prov,
    });
  }

  console.log(`Configured ${providers.length} shipping providers.`);
}

// Allow direct CLI invocation
if (process.argv[1]?.endsWith('seed-logistics.js')) {
  seedLogistics()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
