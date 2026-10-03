import type { NextConfig } from "next";
import { resolve } from "path";
import { config } from "dotenv";

// โหลด .env จาก root และ frontend เพื่อให้ Next.js มองเห็น DATABASE_URL เสมอ
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, ".env") });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://shuttle:shuttle_dev@localhost:5433/university_shuttle_tracking?schema=public";
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
