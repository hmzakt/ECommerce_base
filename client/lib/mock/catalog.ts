import type { Category, Product } from "@/lib/types/catalog";

const now = "2026-01-15T10:00:00.000Z";

export const mockCategories: Category[] = [
  {
    id: "cat-home-decor",
    name: "Home Decor",
    slug: "home-decor",
    description: "Sculptural objects and refined accents for considered spaces.",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-beauty",
    name: "Beauty",
    slug: "beauty",
    description: "Skincare and fragrance rituals for daily ceremony.",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=800&q=80",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-lighting",
    name: "Lighting",
    slug: "lighting",
    description: "Ambient light for rooms that breathe.",
    image:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Ceramic Vessel",
    slug: "ceramic-vessel",
    shortDescription: "Hand-thrown stoneware with a matte glaze finish.",
    description: null,
    sku: "HD-001",
    brand: "Maison Atelier",
    price: "4200",
    compareAtPrice: "5200",
    categoryId: "cat-home-decor",
    isActive: true,
    isFeatured: true,
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-home-decor", name: "Home Decor", slug: "home-decor" },
    images: [
      {
        id: "img-1",
        url: "https://images.unsplash.com/photo-1578749552338-2a94dcfa4f26?w=800&q=80",
        alt: "Ceramic vessel on wooden surface",
        displayOrder: 0,
      },
    ],
  },
  {
    id: "prod-2",
    name: "Linen Throw",
    slug: "linen-throw",
    shortDescription: "Washed Belgian linen in a warm natural tone.",
    description: null,
    sku: "HD-002",
    brand: "Maison Atelier",
    price: "6800",
    compareAtPrice: null,
    categoryId: "cat-home-decor",
    isActive: true,
    isFeatured: true,
    createdAt: "2026-01-28T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-home-decor", name: "Home Decor", slug: "home-decor" },
    images: [
      {
        id: "img-2",
        url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
        alt: "Linen throw draped over a sofa",
        displayOrder: 0,
      },
    ],
  },
  {
    id: "prod-3",
    name: "Brass Candleholder",
    slug: "brass-candleholder",
    shortDescription: "Sculptural brass form for taper candles.",
    description: null,
    sku: "HD-003",
    brand: "Maison Atelier",
    price: "3400",
    compareAtPrice: null,
    categoryId: "cat-home-decor",
    isActive: true,
    isFeatured: false,
    createdAt: "2026-01-25T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-home-decor", name: "Home Decor", slug: "home-decor" },
    images: [
      {
        id: "img-3",
        url: "https://images.unsplash.com/photo-1602874801006-4f601a3e2a1a?w=800&q=80",
        alt: "Brass candleholder with lit candle",
        displayOrder: 0,
      },
    ],
  },
  {
    id: "prod-4",
    name: "Botanical Face Oil",
    slug: "botanical-face-oil",
    shortDescription: "Cold-pressed botanical blend for evening ritual.",
    description: null,
    sku: "BT-001",
    brand: "Maison Beauty",
    price: "2800",
    compareAtPrice: "3200",
    categoryId: "cat-beauty",
    isActive: true,
    isFeatured: true,
    createdAt: "2026-02-05T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-beauty", name: "Beauty", slug: "beauty" },
    images: [
      {
        id: "img-4",
        url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
        alt: "Botanical face oil bottle",
        displayOrder: 0,
      },
    ],
  },
  {
    id: "prod-5",
    name: "Mineral Clay Mask",
    slug: "mineral-clay-mask",
    shortDescription: "Purifying clay mask with rose and chamomile.",
    description: null,
    sku: "BT-002",
    brand: "Maison Beauty",
    price: "1900",
    compareAtPrice: null,
    categoryId: "cat-beauty",
    isActive: true,
    isFeatured: false,
    createdAt: "2026-02-03T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-beauty", name: "Beauty", slug: "beauty" },
    images: [
      {
        id: "img-5",
        url: "https://images.unsplash.com/photo-1556228578-0d85b5a6281?w=800&q=80",
        alt: "Mineral clay mask jar",
        displayOrder: 0,
      },
    ],
  },
  {
    id: "prod-6",
    name: "Table Lamp",
    slug: "table-lamp",
    shortDescription: "Soft-glow table lamp with linen shade.",
    description: null,
    sku: "LT-001",
    brand: "Maison Atelier",
    price: "12500",
    compareAtPrice: null,
    categoryId: "cat-lighting",
    isActive: true,
    isFeatured: true,
    createdAt: "2026-01-20T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-lighting", name: "Lighting", slug: "lighting" },
    images: [
      {
        id: "img-6",
        url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
        alt: "Minimal table lamp on bedside table",
        displayOrder: 0,
      },
    ],
  },
  {
    id: "prod-7",
    name: "Pendant Light",
    slug: "pendant-light",
    shortDescription: "Hand-blown glass pendant for ambient dining light.",
    description: null,
    sku: "LT-002",
    brand: "Maison Atelier",
    price: "18900",
    compareAtPrice: "22000",
    categoryId: "cat-lighting",
    isActive: true,
    isFeatured: true,
    createdAt: "2026-01-18T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-lighting", name: "Lighting", slug: "lighting" },
    images: [
      {
        id: "img-7",
        url: "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&q=80",
        alt: "Glass pendant light hanging above table",
        displayOrder: 0,
      },
    ],
  },
  {
    id: "prod-8",
    name: "Scented Candle",
    slug: "scented-candle",
    shortDescription: "Soy wax candle with notes of cedar and vetiver.",
    description: null,
    sku: "BT-003",
    brand: "Maison Beauty",
    price: "2400",
    compareAtPrice: null,
    categoryId: "cat-beauty",
    isActive: true,
    isFeatured: false,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: now,
    category: { id: "cat-beauty", name: "Beauty", slug: "beauty" },
    images: [
      {
        id: "img-8",
        url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
        alt: "Scented candle in glass vessel",
        displayOrder: 0,
      },
    ],
  },
];

export function filterMockProducts(params: {
  featured?: boolean;
  sortBy?: string;
  limit?: number;
  category?: string;
}): Product[] {
  let results = [...mockProducts];

  if (params.featured) {
    results = results.filter((product) => product.isFeatured);
  }

  if (params.category) {
    results = results.filter(
      (product) => product.category.slug === params.category,
    );
  }

  switch (params.sortBy) {
    case "oldest":
      results.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;
    case "price_asc":
      results.sort(
        (a, b) => parseFloat(a.price) - parseFloat(b.price),
      );
      break;
    case "price_desc":
      results.sort(
        (a, b) => parseFloat(b.price) - parseFloat(a.price),
      );
      break;
    case "newest":
    default:
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }

  return results.slice(0, params.limit ?? results.length);
}

export function getMockProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((product) => product.slug === slug);
}
