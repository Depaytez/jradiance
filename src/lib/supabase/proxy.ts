import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js middleware for session management and route protection
 *
 * Handles:
 * 1. Session refresh on every request using Supabase cookies
 * 2. Route protection for authenticated pages (/account, /admin)
 * 3. Redirect to login page for unauthenticated access to protected routes
 *
 * @param {NextRequest} request - Incoming HTTP request with cookies
 * @returns {NextResponse} Response with updated session/redirects as needed
 *
 * @note This middleware runs on every request
 * @note Protected routes: /account/*, /admin/*
 *
 * @example
 * // In middleware.ts, export this function as default
 * export default updateSession;
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // === Session Refresh ===
  // Create server client to refresh session cookies if needed
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // === Get Current User ===
  // Check if user is authenticated by retrieving their session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // === Route Protection ===
  // Define routes that require authentication
  const isProtectedRoute =
    path.startsWith("/account") || path.startsWith("/admin");

  // If unauthenticated user tries to access protected route, redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Store the intended destination for post-login redirect
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
