import { prisma } from "@backend/lib/prisma";
import { withErrorHandling } from "@backend/lib/api";
import { MOCK_VEHICLES } from "../../../../../mockup/mockData";

const LIVE_GPS_TIMEOUT_MS = 3 * 60 * 1000; // 3 นาที

export const GET = withErrorHandling(async () => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        routeId: true,
        latitude: true,
        longitude: true,
        lastSeenAt: true,
        isActive: true,
        route: { select: { id: true, name: true, color: true } },
      },
      orderBy: { id: "asc" },
    });

    if (vehicles && vehicles.length > 0) {
      const now = Date.now();
      const enriched = vehicles.map((v) => {
        const lastSeenTime = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : 0;
        const isLive = Boolean(lastSeenTime && (now - lastSeenTime) < LIVE_GPS_TIMEOUT_MS);
        return {
          ...v,
          isLive,
        };
      });
      return Response.json(enriched);
    }
  } catch (error) {
    console.warn("[Vehicles API] Database unavailable, falling back to mock dataset");
  }

  const fallback = MOCK_VEHICLES.map((v) => ({
    ...v,
    isLive: false,
  }));
  return Response.json(fallback);
});
