import { prisma } from "@backend/lib/prisma";
import { requireRole } from "@backend/lib/auth";
import { parseJson, withErrorHandling } from "@backend/lib/api";
import { normalizeOptionalString, stopSchema, validate } from "@backend/lib/validation";
import { MOCK_STOPS } from "../../../../mockup/mockData";

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");

  try {
    const stops = await prisma.stop.findMany({
      where: active === "true" ? { isActive: true } : undefined,
      orderBy: { id: "asc" },
    });
    if (stops && stops.length > 0) {
      return Response.json(stops);
    }
  } catch (error) {
    console.warn("[Stops API] Database unavailable, falling back to mock dataset");
  }

  return Response.json(MOCK_STOPS);
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireRole("ADMIN");
  const body = validate(stopSchema, await parseJson(request));
  const stop = await prisma.stop.create({
    data: {
      ...body,
      nameTh: body.nameTh.trim(),
      nameEn: normalizeOptionalString(body.nameEn),
      imageUrl: normalizeOptionalString(body.imageUrl),
    },
  });
  return Response.json(stop, { status: 201 });
});
