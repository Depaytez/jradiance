import type { Metadata } from "next";
import "./globals.css";

const bodyClasses = `
  min-h-screen 
  bg-radiance-creamBackgroundColor 
  text-radiance-charcoalTextColor 
  font-sans
  antialiased
`;

export const metadata: Metadata = {
  title: {
    default: "JRADIANCE STORE | Organic body care products ",
    template: "%s | JRADIANCE STORE",
  },
  description:
    "JRADIANCE is a digital market place to shop for organic body care products",
  openGraph: {
    title: "JRADIANCE STORE",
    description: "Shop for organic body care products.",
    url: "https://jradianceco.com",
    siteName: "JRADIANCE",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  alternates: { canonical: "https://jradianceco.com" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyClasses}`}>
        {/* Nave bar: add later */}
        {/* <Navbar/> */}

        {/* Main content */}
        <main>
          <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>
        </main>

        {/* Footer: add later */}
        {/* <Footer/> */}
      </body>
    </html>
  );
}
