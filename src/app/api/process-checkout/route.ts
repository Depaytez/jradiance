import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";

/** Extracted type for inserting profiles into Supabase */
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

/** Extracted type for inserting orders into Supabase */
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

/** Admin Supabase client with service role permissions for server-side operations */
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST handler for checkout process
 *
 * Handles the complete checkout workflow:
 * 1. Verifies payment with Paystack payment gateway
 * 2. Creates user account if new customer (auth + profile)
 * 3. Creates order record with cart items and shipping address
 * 4. Sends welcome email to new users
 *
 * @param {Request} req - HTTP request containing:
 *   - cart: Array of cart items {productId, quantity}
 *   - form: Customer details {email, name, phone, address}
 *   - payment_ref: Paystack transaction reference
 *   - total: Order total amount
 *
 * @returns {Promise<NextResponse>} JSON response with success status or error message
 * @throws Will return 400 if payment verification fails
 * @throws Will return 400 if product not found in validation
 * @throws Will return 500 on database or service errors
 */
export async function POST(req: Request) {
  try {
    const { cart, form, payment_ref, total } = await req.json();

    // === STEP 1: Verify Payment with Paystack ===
    // Call Paystack API to confirm the transaction was successful
    // This prevents fraudulent orders from unverified payments
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${payment_ref}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );
    const paystackData = await paystackRes.json();

    // Reject order if payment verification fails
    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    // === STEP 2: Retrieve or Create User ===
    // Check if customer already exists in authentication system
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let targetUser = users.find((u) => u.email === form.email);

    if (!targetUser) {
      // NEW USER: Create authentication account with provided details
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: form.email,
          email_confirm: true, // Auto-confirm email to allow immediate login
          user_metadata: { name: form.name, phone: form.phone },
        });
      if (createError) throw createError;
      targetUser = newUser.user;

      // === STEP 3: Create Customer Profile ===
      // Required for foreign key relationship with orders table
      const profileData: ProfileInsert = {
        id: targetUser.id,
        email: form.email,
        name: form.name,
        phone: form.phone,
        role: "customer", // Default role for new customers
      };

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert(profileData);
      if (profileError) throw profileError;

      // === STEP 4: Send Welcome Email ===
      // Trigger password reset flow for new customer to set password
      await supabaseAdmin.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account`,
      });
    }

    // === STEP 5: Create Order Record ===
    // Insert completed order with all items and shipping information
    const orderData: OrderInsert = {
      user_id: targetUser.id,
      payment_ref, // Link to Paystack transaction for audit trail
      total_amount: total,
      items: cart, // JSONB stores the array of items (productId, quantity)
      status: "pending", // Will be updated when order is processed/shipped
      address: { detail: form.address, phone: form.phone },
    };

    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderData);

    if (orderError) throw orderError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    // Extract error message safely, handling both Error objects and other types
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Checkout Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
