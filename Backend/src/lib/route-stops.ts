import type { Prisma } from "@prisma/client";
import { ApiError } from "./api";

const TEMPORARY_ORDER_OFFSET = 1_000_000;

export async function reorderRouteStops(
  tx: Prisma.TransactionClient,
  routeId: number,
  stopIds: number[],
) {
  const existing = await tx.routeStop.findMany({ where: { routeId }, orderBy: { stopOrder: "asc" } });
  const existingIds = new Set(existing.map((item) => item.stopId));
  const requestedIds = new Set(stopIds);
  if (existing.length !== stopIds.length || existing.some((item) => !requestedIds.has(item.stopId))) {
    throw new ApiError(400, "รายการจุดจอดใหม่ต้องมีจุดจอดเดิมครบทุกจุดและไม่ซ้ำกัน");
  }
  if (stopIds.some((stopId) => !existingIds.has(stopId))) {
    throw new ApiError(400, "ไม่สามารถเพิ่มจุดจอดใหม่ด้วยคำสั่ง reorder ได้");
  }

  await tx.routeStop.updateMany({ where: { routeId }, data: { stopOrder: { increment: TEMPORARY_ORDER_OFFSET } } });
  for (const [index, stopId] of stopIds.entries()) {
    await tx.routeStop.update({ where: { routeId_stopId: { routeId, stopId } }, data: { stopOrder: index + 1 } });
  }
}

export async function compactRouteStops(tx: Prisma.TransactionClient, routeId: number, keepStopIds?: number[]) {
  const current = await tx.routeStop.findMany({ where: { routeId }, orderBy: { stopOrder: "asc" } });
  const ids = keepStopIds ?? current.map((item) => item.stopId);
  await tx.routeStop.updateMany({ where: { routeId }, data: { stopOrder: { increment: TEMPORARY_ORDER_OFFSET } } });
  for (const [index, stopId] of ids.entries()) {
    await tx.routeStop.update({ where: { routeId_stopId: { routeId, stopId } }, data: { stopOrder: index + 1 } });
  }
}
