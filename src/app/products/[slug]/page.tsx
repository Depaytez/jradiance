import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton'; // we'll create this next

interface Props {
  params: { slug: string };
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = await createClient();
 
//   const product = data as ProductRow | null;
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single();

  if (error || !product) {
    notFound();
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://picsum.photos/id/1060/800/800'];

  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor pb-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
            <Image
              src={images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Details */}
          <div>
            <h1 className="text-3xl font-bold text-radiance-cocoaColor mb-2">
              {product.name}
            </h1>
            <p className="text-4xl font-bold text-radiance-goldColor mb-6">
              ₦{Number(product.price).toFixed(2)}
            </p>

            <div className="prose text-radiance-charcoalTextColor mb-8">
              {product.description}
            </div>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-sm text-gray-600">Stock:</span>
              <span className="font-medium">{product.stock} left</span>
            </div>

            <AddToCartButton product={product} />

            <div className="mt-12 pt-8 border-t">
              <h3 className="font-medium mb-3">Key Benefits</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ 100% Natural ingredients</li>
                <li>✓ Cruelty-free</li>
                <li>✓ Suitable for sensitive skin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}