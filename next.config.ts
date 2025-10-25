import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/app/(api)/api/cron/gemini-dispatch/route": ["./lib/gemini/defaults/**/*"],
    "/app/(api)/api/gemini/analyze/route": ["./lib/gemini/defaults/**/*"],
    "/app/(api)/api/gemini/batch/route": ["./lib/gemini/defaults/**/*"],
    "/app/(api)/api/gemini/structure/route": ["./lib/gemini/defaults/**/*"],
    "/app/(api)/api/gemini/uploads/route": ["./lib/gemini/defaults/**/*"],
    "app/(api)/api/cron/gemini-dispatch/route": ["./lib/gemini/defaults/**/*"],
    "app/(api)/api/gemini/analyze/route": ["./lib/gemini/defaults/**/*"],
    "app/(api)/api/gemini/batch/route": ["./lib/gemini/defaults/**/*"],
    "app/(api)/api/gemini/structure/route": ["./lib/gemini/defaults/**/*"],
    "app/(api)/api/gemini/uploads/route": ["./lib/gemini/defaults/**/*"],
  },
  images: {
    remotePatterns: [
      // formerly `domains: ["picsum.photos"]`
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },

      // formerly `domains: ["placehold.co"]`
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },

      // formerly `domains: ["icons.duckduckgo.com"]`
      { protocol: "https", hostname: "icons.duckduckgo.com", pathname: "/**" },

      // formerly `domains: ["logo.clearbit.com"]`
      { protocol: "https", hostname: "logo.clearbit.com", pathname: "/**" },

      // keep your Vercel Blob rule (allow any subdomain), restrict to /blocks/**
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/blocks/**",
      },
    ],
  },
};

export default nextConfig;
