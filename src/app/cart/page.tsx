"use client";

import { useCart } from "@/hooks/useCart";
import { Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalOrder } = useCart();

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor py-20 text-center">
        <ShoppingBag
          size={48}
          className="mx-auto text-radiance-goldColor mb-4"
        />
        <p className="text-xl font-medium text-radiance-cocoaColor mb-2">
          Your cart is empty
        </p>
        <p className="text-gray-600 mb-6">Add some organic goodness!</p>
        <Link
          href="/"
          className="px-6 py-3 bg-radiance-goldColor text-white rounded-md hover:bg-radiance-amberAccentColor"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor py-12">
      <main className="mx-auto max-w-4xl px-6">
        <h1 className="text-3xl font-bold mb-8 text-radiance-cocoaColor">
          Your Cart
        </h1>
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between items-center py-4 border-b last:border-0"
            >
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-radiance-goldColor">
                  ₦{item.price.toFixed(2)} x {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.productId, Number(e.target.value))
                  }
                  className="w-16 text-center border rounded"
                  min={1}
                />
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold mb-4 text-radiance-cocoaColor">
            Total: ₦{totalOrder.toFixed(2)}
          </p>
          <Link
            href="/checkout"
            className="px-8 py-3 bg-radiance-goldColor text-white rounded-md hover:bg-radiance-amberAccentColor"
          >
            Proceed to Checkout
          </Link>
        </div>
      </main>
    </div>
  );
}
