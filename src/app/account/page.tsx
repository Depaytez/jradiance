// src/app/account/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import OrderDetailsPanel from '@/components/OrderDetailsPanel';
import { Suspense } from 'react';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export const metadata = {
  title: 'My Account | JRADIANCE',
  description: 'View your order history, active cart, and delivery status',
};

export default async function AccountPage() {
  const supabase = await createClient();

  // Get current user (middleware already redirected if not logged in)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  // Fetch user's profile (for name display)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  // Fetch all orders for this user
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Orders fetch error:', error);
    // You can show error UI here
  }

  // Classify orders
  const activeOrders = orders?.filter(o => o.status === 'pending' && !o.payment_ref) || [];
  const pendingOrders = orders?.filter(o => o.status === 'pending' && o.payment_ref) || [];
  const completedOrders = orders?.filter(o => o.status === 'delivered' || o.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor pb-24 md:pb-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-radiance-cocoaColor mb-2">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Manage your orders, track deliveries, and view receipts
        </p>

        <div className="space-y-12">
          {/* Active Orders (not yet paid) */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              Active Cart {activeOrders.length > 0 && <span className="text-sm font-normal text-gray-500">({activeOrders.length})</span>}
            </h2>
            {activeOrders.length === 0 ? (
              <EmptyState text="No active cart. Start shopping!" />
            ) : (
              <OrderList orders={activeOrders} type="active" />
            )}
          </section>

          {/* Pending Orders (paid, awaiting delivery) */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              Pending Orders {pendingOrders.length > 0 && <span className="text-sm font-normal text-gray-500">({pendingOrders.length})</span>}
            </h2>
            {pendingOrders.length === 0 ? (
              <EmptyState text="No pending orders" />
            ) : (
              <OrderList orders={pendingOrders} type="pending" />
            )}
          </section>

          {/* Completed Orders */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              Order History {completedOrders.length > 0 && <span className="text-sm font-normal text-gray-500">({completedOrders.length})</span>}
            </h2>
            {completedOrders.length === 0 ? (
              <EmptyState text="No completed orders yet" />
            ) : (
              <OrderList orders={completedOrders} type="completed" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Reusable small card for each order
function OrderCard({ order, type }: { order: OrderRow; type: 'active' | 'pending' | 'completed' }) {
  const items = order.items as Array<{ name: string; quantity: number; price: number }>;
  const firstItem = items[0];

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">
            Order #{order.id.slice(0, 8)}
          </p>
          <p className="font-medium">
            {firstItem?.name || 'Multiple items'} {items.length > 1 && `+${items.length - 1} more`}
          </p>
        </div>
        <p className="text-xl font-bold text-radiance-goldColor">
          ₦{Number(order.total_amount).toFixed(2)}
        </p>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {new Date(order.created_at || '').toLocaleDateString()}
      </div>

      {type === 'active' && (
        <Link
          href="/checkout"
          className="block w-full py-3 bg-radiance-goldColor text-white text-center rounded-lg hover:bg-radiance-amberAccentColor transition"
        >
          Proceed to Checkout
        </Link>
      )}

      {type === 'pending' && (
        <button
          // onClick={() => confirmDelivery(order.id)} – implement later
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Confirm Delivery
        </button>
      )}

      {type === 'completed' && (
        <button className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
          Download Receipt
        </button>
      )}
    </div>
  );
}

// List of orders in a grid
function OrderList({ orders, type }: { orders: OrderRow[]; type: 'active' | 'pending' | 'completed' }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} type={type} />
      ))}
    </div>
  );
}

// Simple empty state component
function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
      <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
      <p className="text-lg text-gray-600">{text}</p>
    </div>
  );
}