import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { parseJson, withErrorHandling } from "@backend/lib/api";
import { normalizeOptionalString, routeSchema, validate } from "@backend/lib/validation";
import { getRoutesWithGeometry } from "../../../../mockup/mockData";

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");

  try {
    const routes = await prisma.route.findMany({
      where: active === "true" ? { isActive: true } : undefined,
      include: {
        routeStops: { orderBy: { stopOrder: "asc" }, include: { stop: true } },
        _count: { select: { routeStops: true, vehicles: true } },
      },
      orderBy: { name: "asc" },
    });

    if (routes && routes.length > 0) {
      const routesWithGeometry = routes.map((route) => ({
        ...route,
        geometry: route.routeStops.map((rs) => [
          Number(rs.stop.latitude),
          Number(rs.stop.longitude),
        ]),
      }));

      return Response.json(routesWithGeometry);
    }
  } catch (error) {
    console.warn("[Routes API] Database unavailable, falling back to mock dataset");
  }

  return Response.json(getRoutesWithGeometry());
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireRole("ADMIN");
  const body = validate(routeSchema, await parseJson(request));
  const route = await prisma.route.create({
    data: {
      ...body,
      name: body.name.trim(),
      color: normalizeOptionalString(body.color),
    },
  });
  return Response.json(route, { status: 201 });
});
