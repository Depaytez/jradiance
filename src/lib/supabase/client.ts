import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";

/**
 * Creates a browser-side Supabase client for client-side operations
 *
 * Uses the public anon key (safe to expose in client code) and handles
 * session management through browser cookies. Used in client components
 * and React hooks.
 *
 * @returns {SupabaseClient} Authenticated Supabase client instance
 *
 * @note Use this for client-side operations only (React hooks, pages with "use client")
 * @note For server-side operations, use the server client instead
 *
 * @example
 * const supabase = createClient();
 * const { data } = await supabase.from('products').select('*');
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
