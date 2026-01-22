import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { Database } from "@/types/supabase";

export const metadata: Metadata = {
  title: "JRADIANCE STORE - Organic body care products ",
  description:
    "Discover organic body care products from JRADIANCE digital market place",
};

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, price, images, description")
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("name")
    .limit(12);

  const products = data as Database['public']['Tables']['products']['Row'][] | null;
    
  if (error) {
    console.error("Error fetching products: ", error);
    return <div className="text-center py-10 text-red-600">Error loading products. Please try again</div>;
  }

  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor">
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16 text-radiance-cocoaColor">
          Welcome to JRADIANCE
        </h1>

        {products?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
              // <div
              //   key={product.id}
              //   className="
              //     group bg-white rounded-xl overflow-hidden
              //     shadow-sm hover:shadow-2xl hover:bg-gradient-to-br hover:from-white hover:to-radiance-glow-gradient transition-all duration-300
              //     border border-gray-100
              //   "
              // >
              //   <div className="aspect-square bg-gray-50 relative">
              //     {/* Placeholder for image */}
              //     <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              //       {product.images?.[0] ? 'Image' : 'No image yet'}
              //     </div>
              //   </div>
              //   <div className="p-5">
              //     <h3 className="font-medium text-lg mb-1 line-clamp-2 text-radiance-charcoalTextColor">
              //       {product.name}
              //     </h3>
              //     <p className="text-xl font-bold text-radiance-goldColor">
              //       ₦{Number(product.price).toFixed(2)}
              //     </p>
              //   </div>
              // </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <p className="text-2xl font-medium text-radiance-cocoaColor mb-4">
              No products available yet.
            </p>
            <p className="text-gray-600">
              We&apos;re curating the finest organic body care collection.
              <br />
              Check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
