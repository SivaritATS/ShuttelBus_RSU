export type Route = {
  id: number;
  name: string;
  color: string | null;
  isActive: boolean;
  geometry?: [number, number][];
  routeStops?: RouteStop[];
  _count?: { routeStops: number; vehicles: number };
};

export type Stop = {
  id: number;
  nameTh: string;
  nameEn: string | null;
  latitude: number | string;
  longitude: number | string;
  imageUrl: string | null;
  isActive: boolean;
};

export type RouteStop = {
  id: number;
  stopId: number;
  stopOrder: number;
  stop: Stop;
};

export type Vehicle = {
  id: number;
  name: string;
  type: string | null;
  routeId: number | null;
  latitude: number | string | null;
  longitude: number | string | null;
  lastSeenAt: string | null;
  isActive: boolean;
  speed?: number;
  heading?: number;
  tripId?: number | null;
  route: { id: number; name: string; color: string | null } | null;
};

export type Trip = {
  id: number;
  vehicleId: number;
  routeId: number;
  startedAt: string | null;
  endedAt: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  vehicle?: Vehicle;
  route?: Route;
};
