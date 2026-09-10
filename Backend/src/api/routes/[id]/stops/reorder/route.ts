import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { ApiError, parseId, parseJson, withErrorHandling } from "@backend/lib/api";
import { reorderSchema, validate } from "@backend/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const routeId = parseId((await params).id, "Route ID");
  const body = validate(reorderSchema, await parseJson(request));
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route) throw new ApiError(404, "ไม่พบ Route");
  await prisma.$transaction(async (tx) => {
    const existing = await tx.routeStop.findMany({ where: { routeId } });
    if (existing.length !== body.stopIds.length || existing.some((item) => !body.stopIds.includes(item.stopId))) {
      throw new ApiError(400, "รายการจุดจอดต้องมีสมาชิกตรงกับ Route เดิมทุกจุด");
    }
    await tx.routeStop.updateMany({ where: { routeId }, data: { stopOrder: { increment: 1_000_000 } } });
    for (const [index, stopId] of body.stopIds.entries()) {
      await tx.routeStop.update({ where: { routeId_stopId: { routeId, stopId } }, data: { stopOrder: index + 1 } });
    }
  });
  return Response.json(await prisma.routeStop.findMany({ where: { routeId }, orderBy: { stopOrder: "asc" }, include: { stop: true } }));
});
