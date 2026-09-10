import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { jsonError, parseJson, withErrorHandling } from "@backend/lib/api";
import { normalizeOptionalString, routeSchema, validate } from "@backend/lib/validation";

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");
  const routes = await prisma.route.findMany({
    where: active === "true" ? { isActive: true } : undefined,
    include: { _count: { select: { routeStops: true, vehicles: true } } },
    orderBy: { name: "asc" },
  });
  return Response.json(routes);
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireRole("ADMIN");
  const body = validate(routeSchema, await parseJson(request));
  const route = await prisma.route.create({ data: { ...body, name: body.name.trim(), color: normalizeOptionalString(body.color) } });
  return Response.json(route, { status: 201 });
});
