import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname:
          process.env.NEXT_PUBLIC_NAMECHEAP_DOMAIN || "*.stellar.hosting",
      },
    ],
  },
};

export default nextConfig;
