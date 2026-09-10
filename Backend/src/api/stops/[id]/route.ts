import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { ApiError, parseId, parseJson, withErrorHandling } from "@backend/lib/api";
import { normalizeOptionalString, stopSchema, validate } from "@backend/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: Context) => {
  const stop = await prisma.stop.findUnique({ where: { id: parseId((await params).id, "Stop ID") }, include: { routeStops: { include: { route: true }, orderBy: { stopOrder: "asc" } } } });
  if (!stop) throw new ApiError(404, "ไม่พบ Stop");
  return Response.json(stop);
});

export const PATCH = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const id = parseId((await params).id, "Stop ID");
  const body = validate(stopSchema.partial(), await parseJson(request));
  const stop = await prisma.stop.update({ where: { id }, data: { ...body, ...(body.nameTh ? { nameTh: body.nameTh.trim() } : {}), ...(body.nameEn !== undefined ? { nameEn: normalizeOptionalString(body.nameEn) } : {}), ...(body.imageUrl !== undefined ? { imageUrl: normalizeOptionalString(body.imageUrl) } : {}) } });
  return Response.json(stop);
});

export const DELETE = withErrorHandling(async (_request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  await prisma.stop.delete({ where: { id: parseId((await params).id, "Stop ID") } });
  return new Response(null, { status: 204 });
});
