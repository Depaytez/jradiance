import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

/**
 * Upload image to Namecheap hosting and save URL to Supabase
 * @param file - Image file to upload
 * @param productId - Product ID to associate with image
 * @returns Promise with image URL
 */
export async function uploadProductImage(
  file: File,
  productId?: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload image");
  }

  const data = await response.json();
  return data.url;
}

/**
 * Add image URL to product in Supabase
 * @param productId - Product ID
 * @param imageUrl - Image URL to add
 */
export async function addImageToProduct(
  productId: string,
  imageUrl: string,
): Promise<void> {
  // Get current product to access existing images
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("images")
    .eq("id", productId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch product: ${fetchError.message}`);
  }

  // Combine existing images with new one
  const existingImages = product?.images || [];
  const updatedImages = [...existingImages, imageUrl];

  // Update product with new images array
  const { error: updateError } = await supabase
    .from("products")
    .update({ images: updatedImages })
    .eq("id", productId);

  if (updateError) {
    throw new Error(`Failed to update product: ${updateError.message}`);
  }
}

/**
 * Remove image URL from product in Supabase
 * @param productId - Product ID
 * @param imageUrl - Image URL to remove
 */
export async function removeImageFromProduct(
  productId: string,
  imageUrl: string,
): Promise<void> {
  // Get current product
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("images")
    .eq("id", productId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch product: ${fetchError.message}`);
  }

  // Filter out the removed image
  const updatedImages = (product?.images || []).filter(
    (url) => url !== imageUrl,
  );

  // Update product
  const { error: updateError } = await supabase
    .from("products")
    .update({ images: updatedImages })
    .eq("id", productId);

  if (updateError) {
    throw new Error(`Failed to update product: ${updateError.message}`);
  }
}

/**
 * Delete image from Namecheap hosting
 * Note: Requires backend implementation to handle FTP deletion
 * @param imageUrl - Image URL to delete
 */
export async function deleteImageFromHosting(imageUrl: string): Promise<void> {
  const response = await fetch("/api/delete-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete image");
  }
}

/**
 * Upload multiple images at once
 * @param files - Array of image files
 * @param productId - Product ID to associate with images
 */
export async function uploadMultipleImages(
  files: File[],
  productId: string,
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadProductImage(file, productId),
  );
  const urls = await Promise.all(uploadPromises);

  // Update product with all new images
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("images")
    .eq("id", productId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch product: ${fetchError.message}`);
  }

  const existingImages = product?.images || [];
  const allImages = [...existingImages, ...urls];

  const { error: updateError } = await supabase
    .from("products")
    .update({ images: allImages })
    .eq("id", productId);

  if (updateError) {
    throw new Error(`Failed to update product: ${updateError.message}`);
  }

  return urls;
}
