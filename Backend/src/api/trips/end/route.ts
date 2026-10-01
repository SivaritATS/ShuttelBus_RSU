import { prisma } from "@backend/lib/prisma";
import { parseJson, withErrorHandling, ApiError } from "@backend/lib/api";
import { broadcastTrip } from "@backend/lib/realtime";

export const POST = withErrorHandling(async (request: Request) => {
  const body = await parseJson<{ tripId?: number; vehicleId?: number }>(request);
  if (!body.tripId && !body.vehicleId) {
    throw new ApiError(400, "กรุณาระบุ tripId หรือ vehicleId");
  }

  let trip;
  if (body.tripId) {
    trip = await prisma.trip.findUnique({
      where: { id: Number(body.tripId) },
      include: { vehicle: true, route: true },
    });
  } else if (body.vehicleId) {
    trip = await prisma.trip.findFirst({
      where: { vehicleId: Number(body.vehicleId), status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      include: { vehicle: true, route: true },
    });
  }

  if (!trip) throw new ApiError(404, "ไม่พบทริปที่กำลังดำเนินการ");

  const now = new Date();
  const updatedTrip = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "COMPLETED",
      endedAt: now,
    },
    include: {
      vehicle: { select: { id: true, name: true, type: true } },
      route: { select: { id: true, name: true, color: true } },
    },
  });

  // Broadcast realtime event
  await broadcastTrip({ event: "ended", trip: updatedTrip });

  return Response.json({
    success: true,
    message: "จบทริปเรียบร้อย",
    trip: updatedTrip,
  });
});
