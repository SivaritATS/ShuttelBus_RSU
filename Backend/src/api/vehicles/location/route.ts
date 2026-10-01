import { prisma } from "@backend/lib/prisma";
import { parseJson, withErrorHandling, ApiError } from "@backend/lib/api";
import { broadcastLocation } from "@backend/lib/realtime";

export const POST = withErrorHandling(async (request: Request) => {
  const body = await parseJson<{
    vehicleId: number;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    tripId?: number;
  }>(request);

  if (!body.vehicleId || body.latitude === undefined || body.longitude === undefined) {
    throw new ApiError(400, "กรุณาระบุ vehicleId, latitude และ longitude");
  }

  const now = new Date();
  const vehicle = await prisma.vehicle.update({
    where: { id: Number(body.vehicleId) },
    data: {
      latitude: body.latitude,
      longitude: body.longitude,
      lastSeenAt: now,
    },
    include: {
      route: { select: { id: true, name: true, color: true } },
    },
  });

  // บันทึก GpsTrack
  await prisma.gpsTrack.create({
    data: {
      vehicleId: vehicle.id,
      tripId: body.tripId ? Number(body.tripId) : null,
      latitude: body.latitude,
      longitude: body.longitude,
      speed: body.speed !== undefined ? body.speed : null,
      heading: body.heading !== undefined ? body.heading : null,
      recordedAt: now,
    },
  });

  const locationPayload = {
    vehicleId: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    routeId: vehicle.routeId,
    latitude: Number(vehicle.latitude),
    longitude: Number(vehicle.longitude),
    lastSeenAt: vehicle.lastSeenAt,
    speed: body.speed || 0,
    heading: body.heading || 0,
    tripId: body.tripId || null,
    route: vehicle.route,
  };

  // Broadcast realtime via WebSocket server
  await broadcastLocation(locationPayload);

  return Response.json({
    success: true,
    data: locationPayload,
  });
});
