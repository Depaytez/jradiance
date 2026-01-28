import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";

/** Type for product data returned from database */
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/**
 * POST handler for validating shopping cart totals
 *
 * Prevents price tampering by recalculating the order total server-side
 * using current product prices from the database. This ensures customers
 * cannot manipulate prices in client-side code before checkout.
 *
 * @param {Request} req - HTTP request containing:
 *   - cart: Array of cart items with {productId, quantity}
 *
 * @returns {Promise<NextResponse>} JSON response with validatedTotal or error
 * @throws Will return 400 if any product not found in active/non-deleted inventory
 * @throws Will return 500 on database fetch or validation failures
 */
export async function POST(req: Request) {
  try {
    const { cart } = (await req.json()) as {
      cart: { productId: string; quantity: number }[];
    };
    const supabase = await createClient();

    // Extract product IDs from cart items
    const productIds = cart.map((item) => item.productId);

    // === SECURITY: Fetch current prices from database ===
    // Only consider active products that haven't been deleted
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, price")
      .in("id", productIds)
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (fetchError || !products) {
      return NextResponse.json(
        { error: "Failed to fetch prices" },
        { status: 500 },
      );
    }

    // Cast the untyped data to our known ProductRow shape for type safety
    const typedProducts = products as Pick<ProductRow, "id" | "price">[];

    // === Recalculate total server-side ===
    // Multiply current database price by quantity for each item
    let validatedTotal = 0;
    for (const item of cart) {
      const dbProduct = typedProducts.find((p) => p.id === item.productId);
      if (dbProduct) {
        validatedTotal += Number(dbProduct.price) * item.quantity;
      } else {
        // Product not found or has been deactivated - reject cart
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ validatedTotal });
  } catch {
    return NextResponse.json(
      { error: "Validation process failed" },
      { status: 500 },
    );
  }
}
