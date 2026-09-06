/**
 * Image upload abstraction.
 *
 * Required backend contract (not yet implemented):
 *
 *   POST /api/v1/admin/uploads/image
 *   Content-Type: multipart/form-data
 *   Body: { file: File, folder?: string }
 *
 *   Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "url": "https://res.cloudinary.com/...",
 *       "publicId": "folder/asset-id",
 *       "width": 1200,
 *       "height": 800,
 *       "format": "jpg"
 *     }
 *   }
 *
 * The backend must sign Cloudinary uploads server-side.
 * Never expose Cloudinary API secrets in the frontend.
 */

import { API_BASE_URL } from "@/lib/api/client";

export interface UploadedImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface ImageUploadOptions {
  folder?: string;
  signal?: AbortSignal;
  accessToken?: string;
}

export class ImageUploadError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ImageUploadError";
    this.status = status;
  }
}

export async function uploadImage(
  file: File,
  options: ImageUploadOptions = {},
): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);

  if (options.folder) {
    formData.append("folder", options.folder);
  }

  const headers: Record<string, string> = {};
  if (options.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/admin/uploads/image`, {
    method: "POST",
    headers,
    body: formData,
    signal: options.signal,
    credentials: "include",
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new ImageUploadError(
      payload.message ?? "Image upload failed",
      response.status,
    );
  }

  return payload.data as UploadedImage;
}
