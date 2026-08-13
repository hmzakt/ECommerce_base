import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear database in correct order
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.shippingAddress.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.shipping.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('Database cleared.');

  // 2. Create Categories
  const categoriesData = [
    {
      name: 'Home Decor',
      slug: 'home-decor',
      description: 'Sculptural objects and refined accents for considered spaces.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      isActive: true,
    },
    {
      name: 'Beauty',
      slug: 'beauty',
      description: 'Skincare and fragrance rituals for daily ceremony.',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=800&q=80',
      isActive: true,
    },
    {
      name: 'Lighting',
      slug: 'lighting',
      description: 'Ambient light for rooms that breathe.',
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80',
      isActive: true,
    },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log(`Created ${Object.keys(categories).length} categories.`);

  // 3. Create Products
  const productsData = [
    {
      name: "Ceramic Vessel",
      slug: "ceramic-vessel",
      shortDescription: "Hand-thrown stoneware with a matte glaze finish.",
      sku: "HD-001",
      brand: "Maison Atelier",
      price: 4200.00,
      compareAtPrice: 5200.00,
      categorySlug: "home-decor",
      isActive: true,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1578749552338-2a94dcfa4f26?w=800&q=80",
          alt: "Ceramic vessel on wooden surface",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Linen Throw",
      slug: "linen-throw",
      shortDescription: "Washed Belgian linen in a warm natural tone.",
      sku: "HD-002",
      brand: "Maison Atelier",
      price: 6800.00,
      compareAtPrice: null,
      categorySlug: "home-decor",
      isActive: true,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
          alt: "Linen throw draped over a sofa",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Brass Candleholder",
      slug: "brass-candleholder",
      shortDescription: "Sculptural brass form for taper candles.",
      sku: "HD-003",
      brand: "Maison Atelier",
      price: 3400.00,
      compareAtPrice: null,
      categorySlug: "home-decor",
      isActive: true,
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1602874801006-4f601a3e2a1a?w=800&q=80",
          alt: "Brass candleholder with lit candle",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Botanical Face Oil",
      slug: "botanical-face-oil",
      shortDescription: "Cold-pressed botanical blend for evening ritual.",
      sku: "BT-001",
      brand: "Maison Beauty",
      price: 2800.00,
      compareAtPrice: 3200.00,
      categorySlug: "beauty",
      isActive: true,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
          alt: "Botanical face oil bottle",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Mineral Clay Mask",
      slug: "mineral-clay-mask",
      shortDescription: "Purifying clay mask with rose and chamomile.",
      sku: "BT-002",
      brand: "Maison Beauty",
      price: 1900.00,
      compareAtPrice: null,
      categorySlug: "beauty",
      isActive: true,
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1556228578-0d85b5a6281?w=800&q=80",
          alt: "Mineral clay mask jar",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Table Lamp",
      slug: "table-lamp",
      shortDescription: "Soft-glow table lamp with linen shade.",
      sku: "LT-001",
      brand: "Maison Atelier",
      price: 12500.00,
      compareAtPrice: null,
      categorySlug: "lighting",
      isActive: true,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
          alt: "Minimal table lamp on bedside table",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Pendant Light",
      slug: "pendant-light",
      shortDescription: "Hand-blown glass pendant for ambient dining light.",
      sku: "LT-002",
      brand: "Maison Atelier",
      price: 18900.00,
      compareAtPrice: 22000.00,
      categorySlug: "lighting",
      isActive: true,
      isFeatured: true,
      images: [
        {
          url: "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80",
          alt: "Glass pendant light hanging above table",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Scented Candle",
      slug: "scented-candle",
      shortDescription: "Soy wax candle with notes of cedar and vetiver.",
      sku: "BT-003",
      brand: "Maison Beauty",
      price: 2400.00,
      compareAtPrice: null,
      categorySlug: "beauty",
      isActive: true,
      isFeatured: false,
      images: [
        {
          url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
          alt: "Scented candle in glass vessel",
          displayOrder: 1,
        },
      ],
    },
  ];

  for (const prod of productsData) {
    const { categorySlug, images, ...productFields } = prod;
    const category = categories[categorySlug];
    if (!category) {
      console.warn(`Category not found for slug: ${categorySlug}`);
      continue;
    }

    await prisma.product.create({
      data: {
        ...productFields,
        categoryId: category.id,
        images: {
          create: images,
        },
      },
    });
  }

  console.log(`Created ${productsData.length} products.`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
