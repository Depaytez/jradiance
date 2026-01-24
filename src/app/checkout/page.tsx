'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalOrder } = useCart();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);

   useEffect(() => {
    if (cart.length === 0) {
      router.push('/');
    }
  }, [cart, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      alert('Please fill in Name, Email, and Phone.');
      return;
    }

    setLoading(true);

    try {
      // Validate total server-side first (security)
      const validateRes = await fetch('/api/validate-cart-total', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
      });

      if (!validateRes.ok) {
        throw new Error('Cart validation failed');
      }

      const { validatedTotal } = await validateRes.json() as { validatedTotal: number };

      if (Math.abs(validatedTotal - totalOrder) > 0.01) {
        alert('Cart total mismatch. Please refresh your cart.');
        setLoading(false)
        return;
      }

      // Step 2: Paystack popup (script already in layout)
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: form.email.trim(),
        amount: Math.round(totalOrder * 100), // kobo
        currency: 'NGN',
        ref: `jr-${Date.now()}-${Math.random().toString(36).slice(2)}`, // unique
        onClose: () => {
          setLoading(false);
        },
        onSuccess: async (response) => {
          // Step 3: Send to server for user creation + order
          const processRes = await fetch('/api/process-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart,
              form,
              payment_ref: response.reference,
              total: totalOrder,
            }),
          });

          if (processRes.ok) {
            localStorage.removeItem('jradiance-cart');
            router.push('/account');
          } else {
            const err = await processRes.json();
            alert(err.error || 'Payment processed but order failed.');
          }
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
    //  finally {
    //   setLoading(false);
    // }
  };

  if (!cart || !cart.length) {
    // if (typeof window !== 'undefined') router.push('/');
    return null;
    // router.push('/cart');
    // return null;
  }

  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor py-12">
      <main className="mx-auto max-w-lg px-6">
        <h1 className="text-3xl md:text-4xl font-bold text-radiance-cocoaColor mb-10 text-center">
          Checkout Page
        </h1>

        {/* Order Summary */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-medium mb-4 text-radiance-cocoaColor">Order Summary</h2>
          {cart.map((item) => (
            <div key={item.productId} className="flex justify-between py-3 border-b last:border-0">
              <span className="font-medium">
                {item.name} × {item.quantity}
              </span>
              <span className="text-radiance-goldColor">
                ₦{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between mt-6 pt-4 border-t font-bold text-lg text-radiance-cocoaColor">
            <span>Total</span>
            <span>₦{totalOrder.toFixed(2)}</span>
          </div>
        </section>

        {/* Shipping Form */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-5">
            <input
              name="name"
              placeholder="Full Name *"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-radiance-goldColor"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email Address *"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-radiance-goldColor"
              required
            />
            <input
              name="phone"
              placeholder="Phone Number *"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-radiance-goldColor"
              required
            />
            <textarea
              name="address"
              placeholder="Delivery Address (optional)"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-radiance-goldColor resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-8 w-full py-4 bg-radiance-goldColor text-white font-medium rounded-lg hover:bg-radiance-amberAccentColor transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Pay ₦${totalOrder.toFixed(2)} to Checkout`}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            You can track your order status in your cart page after payment.
            We want to see you purchase from us again!
          </p>
        </section>
      </main>
    </div>
  );
}