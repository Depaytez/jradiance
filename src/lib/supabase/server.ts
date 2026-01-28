import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

/**
 * Creates a server-side Supabase client for server-side operations
 *
 * Uses the public anon key with automatic session management via cookies.
 * Designed for server-side operations including API routes, server components,
 * and Next.js actions.
 *
 * @async
 * @returns {Promise<SupabaseClient>} Authenticated Supabase client instance
 *
 * @note Use this for server-side operations only (API routes, server components)
 * @note For client-side operations in React hooks, use the browser client instead
 * @note For admin operations, use the admin client with service role key
 *
 * @example
 * const supabase = await createClient();
 * const { data } = await supabase.from('products').select('*');
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Retrieve cookies from the request
        getAll() {
          return cookieStore.getAll();
        },
        // Set cookies in the response
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
