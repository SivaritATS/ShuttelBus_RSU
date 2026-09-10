import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { ApiError, parseId, parseJson, withErrorHandling } from "@backend/lib/api";
import { compactRouteStops } from "@backend/lib/route-stops";
import { routeStopSchema, validate } from "@backend/lib/validation";

type Context = { params: Promise<{ id: string; stopId: string }> };

export const PATCH = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const { id, stopId } = await params;
  const routeId = parseId(id, "Route ID");
  const targetStopId = parseId(stopId, "Stop ID");
  const body = validate(routeStopSchema.pick({ stopOrder: true }), await parseJson(request));
  const stopOrder = body.stopOrder;
  if (stopOrder === undefined) throw new ApiError(422, "กรุณาระบุ stopOrder");
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.routeStop.findMany({ where: { routeId }, orderBy: { stopOrder: "asc" } });
    if (!current.some((item) => item.stopId === targetStopId)) throw new ApiError(404, "ไม่พบ Stop ใน Route นี้");
    if (stopOrder < 1 || stopOrder > current.length) throw new ApiError(422, "stopOrder อยู่นอกช่วงที่ถูกต้อง");
    const ids = current.map((item) => item.stopId).filter((value) => value !== targetStopId);
    ids.splice(stopOrder - 1, 0, targetStopId);
    await tx.routeStop.updateMany({ where: { routeId }, data: { stopOrder: { increment: 1_000_000 } } });
    for (const [index, nextStopId] of ids.entries()) {
      await tx.routeStop.update({ where: { routeId_stopId: { routeId, stopId: nextStopId } }, data: { stopOrder: index + 1 } });
    }
    return tx.routeStop.findMany({ where: { routeId }, orderBy: { stopOrder: "asc" }, include: { stop: true } });
  });
  return Response.json(result);
});

export const DELETE = withErrorHandling(async (_request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const { id, stopId } = await params;
  const routeId = parseId(id, "Route ID");
  const targetStopId = parseId(stopId, "Stop ID");
  await prisma.$transaction(async (tx) => {
    const target = await tx.routeStop.findUnique({ where: { routeId_stopId: { routeId, stopId: targetStopId } } });
    if (!target) throw new ApiError(404, "ไม่พบ Stop ใน Route นี้");
    await tx.routeStop.delete({ where: { id: target.id } });
    await compactRouteStops(tx, routeId);
  });
  return new Response(null, { status: 204 });
});
