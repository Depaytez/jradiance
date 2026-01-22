"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import { Database } from "@/types/supabase";

type ProductRow = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
  product: Pick<ProductRow, 'id' | 'name' | 'price' | 'images' | 'description'>;
}

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

      <div className="p-5">
        <h3 className="font-medium text-lg mb-1 line-clamp-2 text-radiance-charcoalTextColor">
          {product.name}
        </h3>
        <p className="text-xl font-bold text-radiance-goldColor mb-4">
          ₦{Number(product.price).toFixed(2)}
        </p>
        <button
          onClick={() => addToCart(product)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-radiance-goldColor text-white rounded-md hover:bg-radiance-amberAccentColor transition"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
