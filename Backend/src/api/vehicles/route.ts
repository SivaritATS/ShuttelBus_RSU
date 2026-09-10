import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { ApiError, parseJson, withErrorHandling } from "@backend/lib/api";
import { normalizeOptionalString, validate, vehicleSchema } from "@backend/lib/validation";

export const GET = withErrorHandling(async (request: Request) => {
  await requireRole("ADMIN");
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");
  const vehicles = await prisma.vehicle.findMany({
    where: active === "true" ? { isActive: true } : undefined,
    include: { route: { select: { id: true, name: true, color: true } } },
    orderBy: { name: "asc" },
  });
  return Response.json(vehicles);
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireRole("ADMIN");
  const body = validate(vehicleSchema, await parseJson(request));
  if (body.routeId && !(await prisma.route.findUnique({ where: { id: body.routeId } }))) throw new ApiError(422, "Route ID ไม่ถูกต้อง");
  const hasLocation = body.latitude !== null && body.latitude !== undefined && body.longitude !== null && body.longitude !== undefined;
  const vehicle = await prisma.vehicle.create({ data: { ...body, name: body.name.trim(), type: normalizeOptionalString(body.type), lastSeenAt: hasLocation ? new Date() : null }, include: { route: true } });
  return Response.json(vehicle, { status: 201 });
});
