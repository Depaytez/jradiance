"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader } from "lucide-react";
import { uploadProductImage, removeImageFromProduct } from "@/lib/imageUtils";

interface ProductImageUploadProps {
  productId: string;
  onImageAdded?: (url: string) => void;
  onImageRemoved?: (url: string) => void;
  currentImages?: string[];
}

/**
 * Component for uploading product images to Namecheap hosting
 * Manages multiple images and integrates with Supabase database
 */
export function ProductImageUpload({
  productId,
  onImageAdded,
  onImageRemoved,
  currentImages = [],
}: ProductImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(currentImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.currentTarget.files;
    if (!files) return;

    setError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;

        try {
          // Upload image
          const imageUrl = await uploadProductImage(file, productId);

          // Update state
          setImages((prev) => [...prev, imageUrl]);
          onImageAdded?.(imageUrl);
        } catch (fileError) {
          setError(
            `Failed to upload ${fileName}: ${
              fileError instanceof Error ? fileError.message : "Unknown error"
            }`,
          );
        }
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Remove from Supabase
      await removeImageFromProduct(productId, imageUrl);

      // Update local state
      setImages((prev) => prev.filter((url) => url !== imageUrl));
      onImageRemoved?.(imageUrl);
    } catch (err) {
      setError(
        `Failed to remove image: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    }
  };

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          aria-label="Upload product images"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? "Uploading..." : "Click to upload images"}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP, GIF up to 5MB
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Current Images */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Uploaded Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div
                key={imageUrl}
                className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
              >
                {/* Image */}
                <Image
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23d1d5db'%3E%3Crect width='100' height='100'/%3E%3C/svg%3E";
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveImage(imageUrl)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !isUploading && (
        <p className="text-sm text-gray-500 text-center py-8">
          No images uploaded yet
        </p>
      )}
    </div>
  );
}
