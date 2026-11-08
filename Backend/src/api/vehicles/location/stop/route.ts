import { prisma } from "@backend/lib/prisma";
import { parseJson, withErrorHandling, ApiError } from "@backend/lib/api";
import { broadcastLocation } from "@backend/lib/realtime";

export const POST = withErrorHandling(async (request: Request) => {
  const body = await parseJson<{
    vehicleId: number;
  }>(request);

  if (!body.vehicleId) {
    throw new ApiError(400, "กรุณาระบุ vehicleId");
  }

  const vehicleId = Number(body.vehicleId);

  // เคลียร์ lastSeenAt เป็น null เพื่อให้ระบบจัดสถานะเป็น Standby ทันที
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      lastSeenAt: null,
    },
  }).catch(() => null);

  const stopPayload = {
    id: vehicleId,
    vehicleId: vehicleId,
    name: "",
    type: null,
    routeId: null,
    latitude: null as any,
    longitude: null as any,
    lastSeenAt: null,
    speed: 0,
    heading: 0,
    tripId: null,
    isLive: false,
  };

  // Broadcast ให้ clients ผ่าน WebSocket
  await broadcastLocation(stopPayload);

  return Response.json({
    success: true,
    message: "หยุดแชร์ตำแหน่งเรียบร้อยแล้ว",
    data: stopPayload,
  });
});

