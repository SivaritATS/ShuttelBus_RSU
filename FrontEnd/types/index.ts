export type Route = {
  id: number;
  name: string;
  color: string | null;
  isActive: boolean;
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
  route: { id: number; name: string; color: string | null } | null;
};
