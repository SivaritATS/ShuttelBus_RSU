import { prisma } from "@backend/lib/prisma";
import { withErrorHandling } from "@backend/lib/api";

export const GET = withErrorHandling(async () => {
  const activeTrips = await prisma.trip.findMany({
    where: { status: "IN_PROGRESS" },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          type: true,
          latitude: true,
          longitude: true,
          lastSeenAt: true,
          isActive: true,
        },
      },
      route: {
        select: {
          id: true,
          name: true,
          color: true,
          isActive: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return Response.json(activeTrips);
});
