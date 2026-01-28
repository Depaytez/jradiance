"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import { Database } from "@/types/supabase";

/** Type for product data from Supabase database */
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/**
 * Props for the ProductCard component
 * @interface ProductCardProps
 * @property {Pick<ProductRow, 'id' | 'name' | 'price' | 'images' | 'description'>} product - Product data to display
 */
interface ProductCardProps {
  product: Pick<ProductRow, "id" | "name" | "price" | "images" | "description">;
}

/**
 * Reusable product display card component
 *
 * Renders a product with image, name, price, and add-to-cart button.
 * Displays placeholder text if product image is unavailable.
 *
 * @component
 * @param {ProductCardProps} props - Component props
 * @returns {JSX.Element} Styled product card with interactive add-to-cart button
 *
 * @example
 * <ProductCard product={productData} />
 */
export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div
      className="
            group bg-white rounded-xl overflow-hidden 
            shadow-sm hover:shadow-xl transition-all duration-300 
            border border-gray-100
        "
    >
      {/* === Product Image Section === */}
      <div className="aspect-square bg-gray-50 relative">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="w-full h-full object-cover"
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            "No image yet"
          )}
        </div>
      </div>

      {/* === Product Details Section === */}
      <div className="p-5">
        {/* Product Name */}
        <h3 className="font-medium text-lg mb-1 line-clamp-2 text-radiance-charcoalTextColor">
          {product.name}
        </h3>
        {/* Product Price */}
        <p className="text-xl font-bold text-radiance-goldColor mb-4">
          ₦{Number(product.price).toFixed(2)}
        </p>
        {/* Add to Cart Button */}
        <button
          onClick={() => addToCart(product)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-radiance-goldColor text-white rounded-md hover:bg-radiance-amberAccentColor transition"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
