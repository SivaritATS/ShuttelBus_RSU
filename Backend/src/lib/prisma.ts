import "dotenv/config";
import { resolve } from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// โหลด .env
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(__dirname, "../../../.env") });

const defaultDbUrl =
  "postgresql://shuttle:shuttle_dev@localhost:5433/university_shuttle_tracking?schema=public";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDbUrl;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// สร้าง PrismaClient ใหม่โดยส่ง URL เข้าไปโดยตรง
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || defaultDbUrl,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
