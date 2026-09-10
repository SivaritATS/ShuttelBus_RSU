import { prisma } from "@backend/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", service: "university-shuttle-tracking", database: "ok" });
  } catch {
    return Response.json({ status: "error", service: "university-shuttle-tracking", database: "unavailable" }, { status: 503 });
  }
}
