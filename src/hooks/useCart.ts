"use client";

import { useState, useEffect } from "react";
import { Database } from "@/types/supabase";

/** Type for product data from Supabase database */
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/**
 * Structure of a single cart item
 * @interface CartItem
 * @property {string} productId - Unique identifier for the product
 * @property {string} name - Display name of the product
 * @property {number} price - Current price of the product in currency units
 * @property {number} quantity - Number of units of this product in cart
 */
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Custom hook for managing shopping cart state and persistence
 *
 * Provides complete cart functionality including add, remove, update quantity,
 * and automatic persistence to browser localStorage. Cart state survives
 * page refreshes and browser restarts.
 *
 * @returns {Object} Cart management interface
 * @returns {CartItem[]} cart - Array of items currently in cart
 * @returns {Function} addToCart - Add product to cart or increase quantity
 * @returns {Function} removeFromCart - Remove product from cart completely
 * @returns {Function} updateQuantity - Update quantity for a product in cart
 * @returns {number} totalOrder - Total cost of all items in cart
 *
 * @example
 * const { cart, addToCart, removeFromCart, updateQuantity, totalOrder } = useCart();
 */
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // === Initialize cart from localStorage on component mount ===
  // Restore any saved cart items from previous sessions
  useEffect(() => {
    const storedCart = localStorage.getItem("jradiance-cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // === Persist cart to localStorage whenever it changes ===
  // Only save if cart has items (avoids saving empty carts)
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("jradiance-cart", JSON.stringify(cart));
    }
  }, [cart]);

  /**
   * Add a product to cart or increment its quantity if already present
   * @param {Pick<ProductRow, 'id' | 'name' | 'price'>} product - Product to add
   */
  const addToCart = (product: Pick<ProductRow, "id" | "name" | "price">) => {
    setCart((prev) => {
      // Check if product is already in cart
      const existingItem = prev.find((item) => item.productId === product.id);

      // Ensure price is a number type for calculations
      const numericPrice = Number(product.price);

      if (existingItem) {
        // Product exists: increment its quantity
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      // New product: add to cart with quantity of 1
      return [
        ...prev,
        {
          ...product,
          productId: product.id,
          name: product.name,
          price: numericPrice,
          quantity: 1,
        },
      ];
    });
  };

  /**
   * Remove a product entirely from the cart
   * @param {string} productId - ID of product to remove
   */
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  /**
   * Update the quantity for a product in cart
   * If quantity drops to 0 or below, removes the item instead
   * @param {string} productId - ID of product to update
   * @param {number} quantity - New quantity (must be >= 1 to keep item)
   */
  const updateQuantity = (productId: string, quantity: number) => {
    // Remove item if quantity becomes invalid
    if (quantity < 1) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  /**
   * Calculate total cost of all items in cart
   * Sums (price × quantity) for each item
   */
  const totalOrder = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return { cart, addToCart, removeFromCart, updateQuantity, totalOrder };
}
