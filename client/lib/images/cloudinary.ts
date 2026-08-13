/**
 * Cloudinary delivery URL utilities.
 *
 * No secrets are used here — only public transformation of existing Cloudinary URLs.
 * Uploads must go through the backend API (see lib/images/upload.ts).
 */

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "scale" | "fit" | "limit";
  gravity?: "auto" | "center" | "face";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
}

const CLOUDINARY_HOST = "res.cloudinary.com";

export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

export function buildCloudinaryUrl(
  url: string,
  options: CloudinaryTransformOptions = {},
): string {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);

  const uploadIndex = parts.findIndex((part) => part === "upload");
  if (uploadIndex === -1) {
    return url;
  }

  const transforms: string[] = [];

  if (options.width) {
    transforms.push(`w_${options.width}`);
  }
  if (options.height) {
    transforms.push(`h_${options.height}`);
  }
  if (options.crop) {
    transforms.push(`c_${options.crop}`);
  }
  if (options.gravity) {
    transforms.push(`g_${options.gravity}`);
  }

  transforms.push(`f_${options.format ?? "auto"}`);
  transforms.push(`q_${options.quality ?? "auto"}`);

  const transformString = transforms.join(",");
  const nextPart = parts[uploadIndex + 1];

  if (nextPart?.includes("_")) {
    parts[uploadIndex + 1] = transformString;
  } else {
    parts.splice(uploadIndex + 1, 0, transformString);
  }

  parsed.pathname = `/${parts.join("/")}`;
  return parsed.toString();
}

export function getResponsiveImageUrl(
  url: string,
  width: number,
  height?: number,
): string {
  return buildCloudinaryUrl(url, {
    width,
    height,
    crop: height ? "fill" : "scale",
    gravity: height ? "auto" : undefined,
  });
}
