import { prisma } from "@backend/lib/prisma";
import { withErrorHandling } from "@backend/lib/api";
import { MOCK_VEHICLES } from "../../../../../mockup/mockData";

export const GET = withErrorHandling(async () => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
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
      orderBy: { name: "asc" },
    });

    if (vehicles && vehicles.length > 0) {
      return Response.json(vehicles);
    }
  } catch (error) {
    console.warn("[Vehicles API] Database unavailable, falling back to mock dataset");
  }

  return Response.json(MOCK_VEHICLES);
});
