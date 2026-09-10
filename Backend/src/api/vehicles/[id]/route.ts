import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { ApiError, parseId, parseJson, withErrorHandling } from "@backend/lib/api";
import { normalizeOptionalString, validate, vehicleSchema } from "@backend/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const vehicle = await prisma.vehicle.findUnique({ where: { id: parseId((await params).id, "Vehicle ID") }, include: { route: true } });
  if (!vehicle) throw new ApiError(404, "ไม่พบ Vehicle");
  return Response.json(vehicle);
});

export const PATCH = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const id = parseId((await params).id, "Vehicle ID");
  const body = validate(vehicleSchema.partial(), await parseJson(request));
  if (body.routeId && !(await prisma.route.findUnique({ where: { id: body.routeId } }))) throw new ApiError(422, "Route ID ไม่ถูกต้อง");
  const current = await prisma.vehicle.findUnique({ where: { id }, select: { latitude: true, longitude: true } });
  if (!current) throw new ApiError(404, "ไม่พบ Vehicle");
  const nextLatitude = body.latitude !== undefined ? body.latitude : current.latitude;
  const nextLongitude = body.longitude !== undefined ? body.longitude : current.longitude;
  const locationChanged = body.latitude !== undefined || body.longitude !== undefined;
  const vehicle = await prisma.vehicle.update({ where: { id }, data: { ...body, ...(body.name ? { name: body.name.trim() } : {}), ...(body.type !== undefined ? { type: normalizeOptionalString(body.type) } : {}), ...(locationChanged ? { lastSeenAt: nextLatitude !== null && nextLongitude !== null ? new Date() : null } : {}) }, include: { route: true } });
  return Response.json(vehicle);
});

export const DELETE = withErrorHandling(async (_request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  await prisma.vehicle.delete({ where: { id: parseId((await params).id, "Vehicle ID") } });
  return new Response(null, { status: 204 });
});
