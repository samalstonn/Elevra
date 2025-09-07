import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "picsum.photos",
      "placehold.co",
      "icons.duckduckgo.com",
      "logo.clearbit.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        port: "",
        pathname: "/blocks/**",
      },
    ],
  },
};

export default nextConfig;
