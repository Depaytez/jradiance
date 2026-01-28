import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// === SECURITY: Verify service role key is configured ===
// Required for admin operations like user management
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Admin Supabase client with full service role permissions
 *
 * WARNING: This client uses the service role key which bypasses all RLS policies.
 * Only use on the backend for privileged operations. NEVER expose to client code.
 *
 * Use this client for:
 * - Creating/managing user accounts
 * - Performing admin operations
 * - Operations that require bypassing row-level security
 *
 * Configuration:
 * - autoRefreshToken: false (not needed for server-side admin)
 * - persistSession: false (not needed for server-side admin)
 *
 * @constant {SupabaseClient}
 *
 * @example
 * const { data, error } = await supabaseAdmin.auth.admin.createUser({
 *   email: 'user@example.com',
 *   email_confirm: true
 * });
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
