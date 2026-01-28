// src/components/BottomNavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

//   Navigation component with responsive design
//  
//   Features:
//   - Fixed bottom navigation bar on mobile (full width)
//   - Converts to floating dock on desktop (centered, rounded)
//   - Displays cart item count as badge on cart icon
//   - Highlights active route with gold underline/color change
//   - Real-time cart updates from useCart hook
//  
//   @component
//   @returns {JSX.Element} Responsive navigation bar with home, cart, and wishlist links
//  
//   @note Mobile: Full-width bottom nav with text labels
//   @note Desktop: Floating dock in center-bottom with icon-only display
//  
//   @example
//   export default function RootLayout() {
//     return (
//       <html>
//         <body>
//           // main content 
//           <BottomNavBar />
//         </body>
//       </html>
//     );
//   }
export default function BottomNavBar() {
  /** Current page pathname for active route highlighting */
  const pathname = usePathname();

  /** Cart items from global cart state */
  const { cart } = useCart();

  /**
   * Navigation items configuration
   * Defines routes, labels, icons, and dynamic badges
   */
  const navItems = [
    {
      href: "/cart",
      label: "Cart",
      icon: ShoppingCart,
      /** Dynamic badge showing cart item count */
      badge: cart.length || undefined,
    },
    { href: "/", label: "Home", icon: Home },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40

      md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 
      md:w-fit md:min-w-105
      
      bg-white/90 backdrop-blur-lg border-t border-gray-200 md:border md:rounded-full md:shadow-lg
      md:mx-auto
    ">
      <div className="flex items-center justify-around md:justify-center md:gap-12 px-6 py-3 md:px-8">
        {navItems.map((item) => {
          // === Determine if current route is active ===
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center gap-1 p-2
                transition-colors
                ${
                  isActive
                    ? "text-radiance-goldColor"
                    : "text-radiance-charcoalTextColor hover:text-radiance-goldColor"
                }
              `}
            >
              {/* === Icon with optional cart badge === */}
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="shrink-0"
                />
                {/* Badge showing item count (only for cart when > 0) */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="
                    absolute -top-1 -right-1 
                    bg-radiance-goldColor text-white text-xs font-bold 
                    rounded-full w-5 h-5 flex items-center justify-center
                  ">
                    {item.badge}
                  </span>
                )}
              </div>
              {/* Label - Visible only on mobile */}
              <span className="text-xs font-medium md:hidden">{item.label}</span>

              {/* Active indicator - Visible only on desktop */}
              {isActive && (
                <div className="hidden md:block absolute -bottom-1 w-1 h-1 bg-radiance-goldColor rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}