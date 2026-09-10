import { prisma } from "@backend/lib/prisma";
import { withErrorHandling } from "@backend/lib/api";

export const GET = withErrorHandling(async () => {
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
  return Response.json(vehicles);
});
