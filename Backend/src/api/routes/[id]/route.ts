import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { jsonError, parseId, parseJson, withErrorHandling } from "@backend/lib/api";
import { normalizeOptionalString, routeSchema, validate } from "@backend/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: Context) => {
  const route = await prisma.route.findUnique({
    where: { id: parseId((await params).id, "Route ID") },
    include: { routeStops: { orderBy: { stopOrder: "asc" }, include: { stop: true } }, vehicles: true },
  });
  if (!route) return Response.json({ error: { message: "ไม่พบ Route", code: "NOT_FOUND" } }, { status: 404 });
  return Response.json(route);
});

export const PATCH = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  const id = parseId((await params).id, "Route ID");
  const body = validate(routeSchema.partial(), await parseJson(request));
  const route = await prisma.route.update({ where: { id }, data: { ...body, ...(body.name ? { name: body.name.trim() } : {}), ...(body.color !== undefined ? { color: normalizeOptionalString(body.color) } : {}) } });
  return Response.json(route);
});

export const DELETE = withErrorHandling(async (_request: Request, { params }: Context) => {
  await requireRole("ADMIN");
  await prisma.route.delete({ where: { id: parseId((await params).id, "Route ID") } });
  return new Response(null, { status: 204 });
});
