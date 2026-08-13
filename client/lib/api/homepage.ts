/**
 * Homepage CMS API contract.
 *
 * Backend endpoint (not yet implemented):
 *   GET /api/v1/homepage
 *
 * Expected response shape: HomepageConfig
 *
 * Admin endpoints (future):
 *   GET  /api/v1/admin/homepage
 *   PATCH /api/v1/admin/homepage/sections/:id
 */

import { apiRequest } from "@/lib/api/client";
import type { HomepageConfig } from "@/lib/types/homepage";
import { defaultHomepageConfig } from "@/config/homepage";

export async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    return await apiRequest<HomepageConfig>("/homepage", {
      next: { revalidate: 300 },
    });
  } catch {
    return defaultHomepageConfig;
  }
}
