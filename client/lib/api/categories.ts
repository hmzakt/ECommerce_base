import { apiRequest } from "@/lib/api/client";
import { mockCategories } from "@/lib/mock/catalog";
import type { Category } from "@/lib/types/catalog";

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await apiRequest<{ categories: Category[] }>("/categories");
    return (data.categories ?? []).filter((category) => category.isActive);
  } catch {
    return mockCategories;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  try {
    const data = await apiRequest<{ category: Category }>(`/categories/${slug}`);
    return data.category;
  } catch {
    const category = mockCategories.find((item) => item.slug === slug);
    if (!category) {
      throw new Error(`Category not found: ${slug}`);
    }
    return category;
  }
}
