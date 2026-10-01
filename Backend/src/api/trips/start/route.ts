import { prisma } from "@backend/lib/prisma";
import { parseJson, withErrorHandling, ApiError } from "@backend/lib/api";
import { broadcastTrip } from "@backend/lib/realtime";

export const POST = withErrorHandling(async (request: Request) => {
  const body = await parseJson<{ vehicleId: number; routeId: number }>(request);
  if (!body.vehicleId || !body.routeId) {
    throw new ApiError(400, "กรุณาระบุ vehicleId และ routeId");
  }

  const [vehicle, route] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: Number(body.vehicleId) } }),
    prisma.route.findUnique({ where: { id: Number(body.routeId) } }),
  ]);

  if (!vehicle) throw new ApiError(404, "ไม่พบข้อมูลรถ");
  if (!route) throw new ApiError(404, "ไม่พบเส้นทาง");

  // จบทริปเก่าที่ยังค้างอยู่ของรถคันนี้ก่อน (ถ้ามี)
  await prisma.trip.updateMany({
    where: { vehicleId: vehicle.id, status: "IN_PROGRESS" },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  const now = new Date();
  const trip = await prisma.trip.create({
    data: {
      vehicleId: vehicle.id,
      routeId: route.id,
      startedAt: now,
      status: "IN_PROGRESS",
    },
    include: {
      vehicle: { select: { id: true, name: true, type: true } },
      route: { select: { id: true, name: true, color: true } },
    },
  });

  // ผูก route ให้ vehicle
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { routeId: route.id, isActive: true },
  });

  // Broadcast realtime event
  await broadcastTrip({ event: "started", trip });

  return Response.json({
    success: true,
    message: "เริ่มต้นทริปเรียบร้อย",
    trip,
  }, { status: 201 });
});
