import { parseJson, withErrorHandling, ApiError } from "@backend/lib/api";
import { authenticateVehicle } from "@backend/lib/auth";

export const POST = withErrorHandling(async (request: Request) => {
  const body = await parseJson<{ vehicleId?: number; name?: string }>(request);
  if (!body.vehicleId && !body.name) {
    throw new ApiError(400, "กรุณาระบุ vehicleId หรือ name");
  }

  const result = await authenticateVehicle({
    vehicleId: body.vehicleId ? Number(body.vehicleId) : undefined,
    name: body.name,
  });

  if (!result) {
    throw new ApiError(404, "ไม่พบข้อมูลรถในระบบ หรือรถถูกระงับการใช้งาน");
  }

  return Response.json({
    success: true,
    token: result.token,
    vehicle: {
      id: result.vehicle.id,
      name: result.vehicle.name,
      type: result.vehicle.type,
      routeId: result.vehicle.routeId,
      route: result.vehicle.route,
      isActive: result.vehicle.isActive,
    },
  });
});
