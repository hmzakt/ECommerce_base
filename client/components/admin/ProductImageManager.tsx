"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/lib/images/upload";

export interface ProductImageItem {
  url: string;
  alt: string;
}

interface ProductImageManagerProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  accessToken: string | null;
}

export function ProductImageManager({
  images,
  onChange,
  accessToken,
}: ProductImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // Helper to update a specific image's field
  const updateImage = (index: number, field: keyof ProductImageItem, value: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // Helper to remove an image
  const removeImage = (index: number) => {
    const filtered = images.filter((_, i) => i !== index);
    onChange(filtered.length > 0 ? filtered : [{ url: "", alt: "" }]);
  };

  // Add an empty URL slot
  const addUrlSlot = () => {
    onChange([...images, { url: "", alt: "" }]);
  };

  // Upload one or more local files to Cloudinary
  const handleFiles = async (files: FileList | File[]) => {
    if (!accessToken) {
      setUploadError("Authentication required. Please log in again.");
      return;
    }

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setUploadError("Please select valid image files (PNG, JPG, WebP, GIF, AVIF).");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const uploadPromises = imageFiles.map((file) =>
        uploadImage(file, {
          accessToken,
          folder: "products",
        }).then((data) => ({
          url: data.url,
          alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        }))
      );

      const uploadedImages = await Promise.all(uploadPromises);

      // Filter out any trailing empty slots before appending
      const existing = images.filter((img) => img.url.trim() !== "");
      onChange([...existing, ...uploadedImages]);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload image(s) to Cloudinary.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Replace a single image with a local file
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null || !accessToken) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const data = await uploadImage(file, {
        accessToken,
        folder: "products",
      });

      const updated = [...images];
      updated[replacingIndex] = {
        url: data.url,
        alt: updated[replacingIndex]?.alt || file.name.replace(/\.[^/.]+$/, ""),
      };
      onChange(updated);
    } catch (err: any) {
      console.error("Replace upload error:", err);
      setUploadError(err.message || "Failed to upload image to Cloudinary.");
    } finally {
      setIsUploading(false);
      setReplacingIndex(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  const triggerReplace = (index: number) => {
    setReplacingIndex(index);
    replaceFileInputRef.current?.click();
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">
            Product Images
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Upload images locally to Cloudinary or paste external image URLs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <input
            ref={replaceFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
            className="hidden"
            onChange={handleReplaceFile}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-4 h-4 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload Local Image
          </button>

          <button
            type="button"
            onClick={addUrlSlot}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg border border-white/10 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add via URL
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError("")}
            className="text-red-400/80 hover:text-red-300 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-emerald-500/80 bg-emerald-500/10"
            : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/25"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-sm font-medium text-white/80">
              Uploading to Cloudinary...
            </p>
            <p className="text-xs text-white/40">
              Please wait while your image is being stored and optimized
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-white/80 font-medium">
                Drag and drop your product images here, or{" "}
                <span className="text-emerald-400 underline">browse files</span>
              </p>
              <p className="text-xs text-white/30 mt-1">
                PNG, JPG, WebP, GIF up to 10MB • Saved automatically to Cloudinary
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Cards List */}
      <div className="space-y-3">
        {images.map((img, index) => {
          const isCloudinary = img.url.includes("cloudinary.com");

          return (
            <div
              key={index}
              className="group relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/8 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              {/* Thumbnail Preview */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center">
                {img.url.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.alt || `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23333'><rect width='80' height='80' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='10'>Invalid URL</text></svg>";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-white/20">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-[10px] mt-0.5">No image</span>
                  </div>
                )}

                {/* Primary / Cover Badge */}
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 bg-black/80 text-[10px] text-white/80 font-medium px-1.5 py-0.5 rounded border border-white/15">
                    Cover
                  </span>
                )}
              </div>

              {/* URL & Alt Inputs */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={img.url}
                      onChange={(e) => updateImage(index, "url", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                      placeholder="Image URL (e.g. https://res.cloudinary.com/... or external)"
                    />
                  </div>

                  {/* Cloudinary Badge */}
                  {isCloudinary && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-1 rounded">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                      </svg>
                      Cloudinary
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={img.alt}
                    onChange={(e) => updateImage(index, "alt", e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="Alt text (for accessibility & SEO)"
                  />

                  {/* Replace Button */}
                  <button
                    type="button"
                    title="Replace with local image"
                    disabled={isUploading}
                    onClick={() => triggerReplace(index)}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] text-white/60 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Replace
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    title="Remove image"
                    onClick={() => removeImage(index)}
                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
