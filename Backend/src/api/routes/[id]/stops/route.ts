import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { ApiError, parseId, parseJson, withErrorHandling } from "@backend/lib/api";
import { routeStopSchema, validate } from "@backend/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: Context) => {
  const routeId = parseId((await params).id, "Route ID");
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route) throw new ApiError(404, "ไม่พบ Route");
  const routeStops = await prisma.routeStop.findMany({ where: { routeId }, orderBy: { stopOrder: "asc" }, include: { stop: true } });
  return Response.json(routeStops);
});

export const POST = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const routeId = parseId((await params).id, "Route ID");
  const body = validate(routeStopSchema, await parseJson(request));
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  const stop = await prisma.stop.findUnique({ where: { id: body.stopId } });
  if (!route) throw new ApiError(404, "ไม่พบ Route");
  if (!stop) throw new ApiError(404, "ไม่พบ Stop");

  const created = await prisma.$transaction(async (tx) => {
    const existing = await tx.routeStop.findMany({ where: { routeId }, orderBy: { stopOrder: "asc" } });
    if (existing.some((item) => item.stopId === body.stopId)) throw new ApiError(409, "Stop นี้อยู่ใน Route แล้ว");
    const insertAt = body.stopOrder ?? existing.length + 1;
    if (insertAt < 1 || insertAt > existing.length + 1) throw new ApiError(422, "stopOrder อยู่นอกช่วงที่ถูกต้อง");
    const offset = 1_000_000;
    await tx.routeStop.updateMany({ where: { routeId }, data: { stopOrder: { increment: offset } } });
    for (const [index, item] of existing.entries()) {
      await tx.routeStop.update({ where: { id: item.id }, data: { stopOrder: index + 1 >= insertAt ? index + 2 : index + 1 } });
    }
    return tx.routeStop.create({ data: { routeId, stopId: body.stopId, stopOrder: insertAt }, include: { stop: true } });
  });
  return Response.json(created, { status: 201 });
});
