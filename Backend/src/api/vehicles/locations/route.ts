import { prisma } from "@backend/lib/prisma";
import { withErrorHandling } from "@backend/lib/api";

const LIVE_GPS_TIMEOUT_MS = 15 * 1000; // 15 วินาที เพื่อให้ข้อมูลแม่นยำและเป็นเรียลไทม์ที่สุด

export const GET = withErrorHandling(async () => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        routeId: true,
        latitude: true,
        longitude: true,
        lastSeenAt: true,
        isActive: true,
        route: { select: { id: true, name: true, color: true } },
      },
      orderBy: { id: "asc" },
    });

    if (vehicles && vehicles.length > 0) {
      const now = Date.now();
      const enriched = vehicles.map((v) => {
        const lastSeenTime = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : 0;
        const isLive = Boolean(lastSeenTime && (now - lastSeenTime) < LIVE_GPS_TIMEOUT_MS);
        return {
          ...v,
          // ถ้าไม่มีการแชร์สดจากมือถือคนขับ ไม่ส่งพิกัดเจาะจง ให้เป็น null เพื่อรอ GPS จริงจากมือถือ
          latitude: isLive ? v.latitude : null,
          longitude: isLive ? v.longitude : null,
          isLive,
        };
      });
      return Response.json(enriched);
    }
  } catch (error) {
    console.warn("[Vehicles API] Database query error, using clean vehicle structure:", error);
  }

  // Fallback: ยังมีรถ 3 คันเหมือนเดิม แต่ไม่มีการระบุพิกัดเจาะจง ให้รอพิกัด GPS จากมือถือ
  const fallback = [
    { id: 1, name: "RSU Shuttle 01 (รถรางไฟฟ้า 1)", type: "Electric Tram", routeId: 1, latitude: null, longitude: null, isActive: true, isLive: false, lastSeenAt: null },
    { id: 2, name: "RSU Shuttle 02 (รถรางไฟฟ้า 2)", type: "Electric Tram", routeId: 2, latitude: null, longitude: null, isActive: true, isLive: false, lastSeenAt: null },
    { id: 3, name: "RSU Shuttle 03 (รถมินิบัสรับส่ง)", type: "Mini Bus", routeId: 3, latitude: null, longitude: null, isActive: true, isLive: false, lastSeenAt: null },
  ];
  return Response.json(fallback);
});
