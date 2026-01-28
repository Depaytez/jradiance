// src/components/AddToCartButton.tsx
'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Database } from '@/types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];

interface Props {
  product: Pick<ProductRow, 'id' | 'name' | 'price'>;
  className?: string;
}

export default function AddToCartButton({ product, className = '' }: Props) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product);
    // Optional: toast notification later
    // toast.success(`${product.name} added to cart!`);
  };

  return (
    <button
      onClick={handleAdd}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 
        bg-radiance-goldColor text-white font-medium rounded-lg
        hover:bg-radiance-amberAccentColor transition
        shadow-sm hover:shadow-md active:scale-98
        ${className}
      `}
      aria-label={`Add ${product.name} to cart`}
    >
      <ShoppingCart size={18} />
      Add to Cart
    </button>
  );
}