// src/components/TopBar.tsx
"use client";

import Link from "next/link";
import { User as UserIcon, LogIn, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { User } from "@supabase/supabase-js";

/** Type for user profile data from Supabase database */
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

//  Navigation header component with authentication status and user menu
// 
//  Features:
//  - Displays logo/branding on left side
//  - Shows login button for unauthenticated users
//  - Shows user profile menu for authenticated users
//  - Real-time auth state synchronization
//  - Responsive design with desktop/mobile fallbacks
//  - Dropdown menu with account/settings/logout options
// 
//  @component
//  @returns {JSX.Element} Fixed header with navigation and auth UI
// 
//  @note This is a client component that manages its own auth state
//  @note Uses Supabase real-time listeners for session updates
// 
//  @example
//  export default function RootLayout() {
//    return (
//      <html>
//        <body>
//          <TopBar />
//          {/* rest of layout */}
//        </body>
//      </html>
//    );
//  }
export default function TopBar() {
  /** Current authenticated user (null if unauthenticated) */
  const [user, setUser] = useState<User | null>(null);

  /** User's profile data from 'profiles' table */
  const [profile, setProfile] = useState<Profile | null>(null);

  /** Whether auth state is still being fetched */
  const [loading, setLoading] = useState(true);

  /** Whether user dropdown menu is visible */
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // === STEP 1: Get current user session ===
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // === STEP 2: Fetch user profile if authenticated ===
        // Profile contains additional user info like name, phone, role
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // === STEP 3: Listen for authentication state changes ===
    // Updates UI in real-time when user logs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fetch profile for new session
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
            .then(({ data }) => setProfile(data));
        } else {
          setProfile(null);
        }
      }
    );

    // === Cleanup: Unsubscribe from listener on unmount ===
    // Prevents memory leaks from duplicate listeners
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Handle user logout
   * Signs out from Supabase and closes dropdown menu
   */
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowDropdown(false);
  };

  // === Loading skeleton - shown while fetching auth state ===
  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        {/* === Logo / Branding (Left) === */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-radiance-goldColor tracking-tight">
            JRADIANCE
          </span>
        </Link>

        {/* === User Profile / Auth Section (Right) === */}
        <div className="relative">
          {user ? (
            // === Authenticated User: Show profile button and dropdown ===
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:opacity-80 transition"
              aria-label="User menu"
            >
              <div className="h-10 w-10 rounded-full bg-radiance-goldColor/10 flex items-center justify-center">
                <UserIcon size={20} className="text-radiance-goldColor" />
              </div>
              <span className="hidden sm:inline font-medium text-radiance-charcoalTextColor">
                {profile?.name || user.email?.split("@")[0]}
              </span>
            </button>
          ) : (
            // === Unauthenticated User: Show login button ===
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-radiance-goldColor text-white rounded-md hover:bg-radiance-amberAccentColor transition"
            >
              <LogIn size={18} />
              <span className="font-medium">Login</span>
            </Link>
          )}

          {/* === Dropdown Menu - Shows only for authenticated users === */}
          {user && showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              {/* My Account Link */}
              <Link
                href="/account"
                className="flex items-center gap-2 px-4 py-3 text-radiance-charcoalTextColor hover:bg-gray-50 transition"
                onClick={() => setShowDropdown(false)}
              >
                <UserIcon size={18} />
                <span>My Account</span>
              </Link>
              {/* Settings Link */}
              <Link
                href="/account/settings"
                className="flex items-center gap-2 px-4 py-3 text-radiance-charcoalTextColor hover:bg-gray-50 transition"
                onClick={() => setShowDropdown(false)}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
              {/* Logout Button */}
              <button
                onClick={() => {
                  handleLogout();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}