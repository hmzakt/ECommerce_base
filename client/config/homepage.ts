import type { HomepageConfig } from "@/lib/types/homepage";

/**
 * Default homepage configuration.
 *
 * Serves as fallback until GET /api/v1/homepage is implemented.
 * CMS-managed fields: titles, descriptions, visibility, ordering,
 * selected products/categories, and image URLs (Cloudinary).
 */
export const defaultHomepageConfig: HomepageConfig = {
  seo: {
    title: "Maison — Premium Home Decor & Beauty",
    description:
      "Discover curated home decor and beauty essentials. Editorial design, exceptional craftsmanship, timeless pieces for modern living.",
    ogImage:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80",
  },
  sections: [
    {
      id: "announcement",
      type: "announcement",
      visible: true,
      order: 1,
      text: "Complimentary shipping on orders over ₹5,000",
      link: "/shop",
      linkLabel: "Shop now",
    },
    {
      id: "hero",
      type: "hero",
      visible: true,
      order: 2,
      eyebrow: "Spring Collection 2026",
      title: "Objects of quiet luxury",
      description:
        "Curated pieces for the home and self — where editorial design meets everyday ritual.",
      ctaLabel: "Explore collection",
      ctaHref: "/shop",
      secondaryCtaLabel: "Our story",
      secondaryCtaHref: "/about",
      imageUrl:
        "/img1.png",
      imageAlt: "Minimal living room with curated decor",
    },
    {
      id: "value-props",
      type: "value-props",
      visible: true,
      order: 3,
      items: [
        {
          eyebrow: "Shipping",
          title: "Complimentary delivery",
          description: "On all orders over ₹5,000, delivered within 5–7 business days.",
        },
        {
          eyebrow: "Returns",
          title: "30-day returns",
          description: "Not quite right? Return unworn items within 30 days for a full refund.",
        },
        {
          eyebrow: "Quality",
          title: "Craftsmanship guarantee",
          description: "Every piece is inspected and backed by our atelier quality promise.",
        },
      ],
    },
    {
      id: "featured-categories",
      type: "featured-categories",
      visible: true,
      order: 4,
      title: "Shop by room",
      description: "Explore our curated categories",
      items: [
        {
          categorySlug: "home-decor",
          title: "Home Decor",
          description: "Sculptural objects and refined accents",
          imageUrl:
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
          order: 1,
        },
        {
          categorySlug: "beauty",
          title: "Beauty",
          description: "Skincare and fragrance rituals",
          imageUrl:
            "https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=800&q=80",
          order: 2,
        },
        {
          categorySlug: "lighting",
          title: "Lighting",
          description: "Ambient light for considered spaces",
          imageUrl:
            "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
          order: 3,
        },
      ],
    },
    {
      id: "new-arrivals",
      type: "new-arrivals",
      visible: true,
      order: 5,
      title: "New arrivals",
      description: "The latest additions to our collection",
      selection: {
        mode: "auto",
        sortBy: "newest",
        maxProducts: 4,
      },
    },
    {
      id: "editorial",
      type: "editorial",
      visible: true,
      order: 6,
      eyebrow: "The Edit",
      title: "Designed for stillness",
      description:
        "Every piece is selected for its form, material, and the quiet presence it brings to a room. We believe in fewer, better things.",
      ctaLabel: "Read the story",
      ctaHref: "/journal",
      imageUrl:
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
      imageAlt: "Editorial interior with natural light",
      imagePosition: "right",
    },
    {
      id: "featured-products",
      type: "featured-products",
      visible: true,
      order: 7,
      title: "Featured",
      description: "Handpicked essentials from our atelier",
      selection: {
        mode: "auto",
        maxProducts: 4,
      },
    },
    {
      id: "image-text",
      type: "image-text",
      visible: true,
      order: 8,
      eyebrow: "Beauty Rituals",
      title: "The art of self-care",
      description:
        "Formulations and tools chosen for efficacy and elegance — a daily ritual elevated to ceremony.",
      ctaLabel: "Shop beauty",
      ctaHref: "/categories/beauty",
      imageUrl:
        "https://images.unsplash.com/photo-1570194063590-7899dc8744a8?w=1200&q=80",
      imageAlt: "Beauty products arranged on marble surface",
      layout: "image-left",
    },
    {
      id: "product-carousel",
      type: "product-carousel",
      visible: true,
      order: 9,
      title: "Curated for you",
      description: "A rotating selection of our most-loved pieces",
      selection: {
        mode: "auto",
        sortBy: "newest",
        maxProducts: 8,
      },
    },
    {
      id: "testimonials",
      type: "testimonials",
      visible: true,
      order: 10,
      eyebrow: "From our community",
      title: "Loved by those who value the quiet details",
      items: [
        {
          quote:
            "The ceramic vessel sits perfectly on my console — understated, beautiful, and exactly as pictured.",
          author: "Ananya R.",
          role: "Mumbai",
        },
        {
          quote:
            "Maison has become my go-to for gifts. The packaging alone feels like an experience.",
          author: "Priya M.",
          role: "Bangalore",
        },
        {
          quote:
            "Finally, a brand that understands restraint. Every piece earns its place in my home.",
          author: "David K.",
          role: "Delhi",
        },
      ],
    },
    {
      id: "newsletter",
      type: "newsletter",
      visible: true,
      order: 11,
      title: "Stay in the know",
      description:
        "Receive early access to new collections, editorial stories, and exclusive offers.",
      placeholder: "Your email address",
      submitLabel: "Subscribe",
    },
  ],
};
