import rawData from "./rsu-campus-data.json";

export interface MockStop {
  id: number;
  sequence: number;
  building: string;
  nameTh: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  searchKeywords: string[];
  isActive?: boolean;
}

export interface MockRoute {
  id: number;
  name: string;
  color: string;
  description: string;
  isActive: boolean;
  stopIds: number[];
}

export interface MockVehicle {
  id: number;
  name: string;
  type: string;
  routeId: number;
  latitude: number;
  longitude: number;
  locationDescription: string;
  isActive: boolean;
  lastSeenAt?: string;
  route?: {
    id: number;
    name: string;
    color: string;
  };
}

export const MOCK_STOPS: MockStop[] = rawData.stops.map((s) => ({
  ...s,
  isActive: true,
}));

export const MOCK_ROUTES: MockRoute[] = rawData.routes;

export const MOCK_VEHICLES: MockVehicle[] = rawData.vehicles.map((v) => {
  const route = rawData.routes.find((r) => r.id === v.routeId);
  return {
    ...v,
    lastSeenAt: new Date().toISOString(),
    route: route ? { id: route.id, name: route.name, color: route.color } : undefined,
  };
});

/**
 * ค้นหาจุดจอด/ตึก ตามคำค้นหา (ชื่อภาษาไทย, อังกฤษ, หมายเลขตึก, คีย์เวิร์ด)
 */
export function findStop(query: string): MockStop[] {
  if (!query || !query.trim()) return MOCK_STOPS;
  const q = query.trim().toLowerCase();
  return MOCK_STOPS.filter(
    (stop) =>
      stop.nameTh.toLowerCase().includes(q) ||
      stop.nameEn.toLowerCase().includes(q) ||
      stop.building.toLowerCase().includes(q) ||
      stop.description.toLowerCase().includes(q) ||
      stop.searchKeywords.some((k) => k.toLowerCase().includes(q)),
  );
}

/**
 * ค้นหาจุดจอดตามหมายเลขตึก (เช่น 2, 5, 8, "9", "12", "อุไร")
 */
export function getStopByBuilding(building: string | number): MockStop | undefined {
  const b = String(building).trim().toLowerCase();
  return MOCK_STOPS.find(
    (s) =>
      s.building.toLowerCase().includes(b) ||
      s.searchKeywords.some((k) => k.toLowerCase() === b || k.toLowerCase().includes(b)),
  );
}

/**
 * ดึงจุดจอดตาม ID
 */
export function getStopById(id: number): MockStop | undefined {
  return MOCK_STOPS.find((s) => s.id === id);
}

/**
 * ดึงรายการเส้นทางพร้อม Geometry พิกัดสำหรับวาด Polyline บนแผนที่ Leaflet
 */
export function getRoutesWithGeometry() {
  return MOCK_ROUTES.map((route) => {
    const routeStops = route.stopIds
      .map((stopId, index) => {
        const stop = getStopById(stopId);
        return stop ? { id: index + 1, stopId, stopOrder: index + 1, stop } : null;
      })
      .filter(Boolean);

    const geometry = routeStops.map((rs: any) => [
      Number(rs.stop.latitude),
      Number(rs.stop.longitude),
    ]);

    return {
      id: route.id,
      name: route.name,
      color: route.color,
      description: route.description,
      isActive: route.isActive,
      routeStops,
      geometry,
      _count: {
        routeStops: routeStops.length,
        vehicles: MOCK_VEHICLES.filter((v) => v.routeId === route.id).length,
      },
    };
  });
}

export default {
  stops: MOCK_STOPS,
  routes: MOCK_ROUTES,
  vehicles: MOCK_VEHICLES,
  findStop,
  getStopByBuilding,
  getStopById,
  getRoutesWithGeometry,
};
