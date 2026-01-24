"use client";

import { useState, useEffect } from "react";
import { Database } from "@/types/supabase";

type ProductRow = Database['public']['Tables']['products']['Row'];

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  // details: string;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem("jradiance-cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("jradiance-cart", JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product: Pick<ProductRow, 'id' | 'name' | 'price'>) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);

      const numericPrice = Number(product.price);

      if (existingItem) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, 
        { ...product, productId: product.id, name:product.name, price:numericPrice, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const totalOrder = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return { cart, addToCart, removeFromCart, updateQuantity, totalOrder };
}
