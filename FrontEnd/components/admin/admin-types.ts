import type { Route, RouteStop, Stop, Vehicle } from "@/types";

export type AdminTab = "overview" | "vehicles" | "routes" | "stops";
export type Notice = { kind: "success" | "error"; message: string } | null;

export type VehicleForm = {
  name: string;
  type: string;
  routeId: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
};

export type RouteForm = {
  name: string;
  color: string;
  isActive: boolean;
};

export type StopForm = {
  nameTh: string;
  nameEn: string;
  latitude: string;
  longitude: string;
  imageUrl: string;
  isActive: boolean;
};

export const blankVehicle: VehicleForm = {
  name: "",
  type: "",
  routeId: "",
  latitude: "",
  longitude: "",
  isActive: true,
};

export const blankRoute: RouteForm = { name: "", color: "#165DFF", isActive: true };

export const blankStop: StopForm = {
  nameTh: "",
  nameEn: "",
  latitude: "",
  longitude: "",
  imageUrl: "",
  isActive: true,
};

export type AdminData = {
  routes: Route[];
  vehicles: Vehicle[];
  stops: Stop[];
  selectedRoute: Route | null;
  selectedRouteId: number | null;
  routeStops: RouteStop[];
};
