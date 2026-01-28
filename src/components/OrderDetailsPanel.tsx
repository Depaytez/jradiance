// src/components/OrderDetailsPanel.tsx
'use client';

import { X, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';

interface Order {
  id: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  total: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  createdAt: string;
  paymentRef?: string;
  address?: string;
}

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelivery?: (orderId: string) => void;
}

export default function OrderDetailsPanel({
  order,
  isOpen,
  onClose,
  onConfirmDelivery,
}: Props) {
  const { totalOrder } = useCart(); // only used if active order

  if (!isOpen || !order) return null;

  const isActive = order.status === 'active';
  const isPending = order.status === 'pending';
  const isCompleted = order.status === 'completed';

  return (
    <>
      {/* Overlay (mobile) */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-radiance-cocoaColor">
              Order Details
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <span className={`
                px-4 py-1.5 rounded-full text-sm font-medium
                ${isActive ? 'bg-amber-100 text-amber-800' : ''}
                ${isPending ? 'bg-blue-100 text-blue-800' : ''}
                ${isCompleted ? 'bg-green-100 text-green-800' : ''}
              `}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Items List */}
            <div>
              <h3 className="font-medium mb-3">Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ₦{item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-radiance-goldColor">
                      ₦{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₦{order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>VAT (7.5%)</span>
                <span>₦{(order.total * 0.075).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-radiance-goldColor">
                  ₦{order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Address & Payment */}
            {order.address && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Delivery Address</h3>
                <p className="text-sm text-gray-600">{order.address}</p>
              </div>
            )}
            {order.paymentRef && (
              <div className="text-sm text-gray-500">
                Payment Ref: {order.paymentRef}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t flex gap-4">
            {isActive && (
              <Link
                href="/checkout"
                className="flex-1 py-3 bg-radiance-goldColor text-white font-medium rounded-lg text-center hover:bg-radiance-amberAccentColor transition"
              >
                Pay Now
              </Link>
            )}

            {isPending && onConfirmDelivery && (
              <button
                onClick={() => onConfirmDelivery(order.id)}
                className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Confirm Delivery
              </button>
            )}

            {isCompleted && (
              <button className="flex-1 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2">
                <Download size={18} />
                Download Receipt
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}