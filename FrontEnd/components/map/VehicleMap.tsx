"use client";

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { Vehicle } from "@/types";

function FitBounds({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap();
  useEffect(() => {
    const locations = vehicles.filter((vehicle) => vehicle.latitude !== null && vehicle.longitude !== null);
    if (locations.length === 0) return;
    map.fitBounds(locations.map((vehicle) => [Number(vehicle.latitude), Number(vehicle.longitude)] as [number, number]), { padding: [45, 45], maxZoom: 16 });
  }, [map, vehicles]);
  return null;
}

export default function VehicleMap({ vehicles }: { vehicles: Vehicle[] }) {
  const first = vehicles[0];
  const initial = first?.latitude !== null && first?.latitude !== undefined && first?.longitude !== null && first?.longitude !== undefined
    ? [Number(first.latitude), Number(first.longitude)] as [number, number]
    : [13.9558, 100.5865] as [number, number];

  return <MapContainer center={initial} zoom={15} scrollWheelZoom={false}>
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <FitBounds vehicles={vehicles} />
    {vehicles.map((vehicle) => <CircleMarker key={vehicle.id} center={[Number(vehicle.latitude), Number(vehicle.longitude)]} radius={11} pathOptions={{ color: "var(--navy-2)", fillColor: "var(--blue)", fillOpacity: .95, weight: 3 }}>
      <Popup><strong>{vehicle.name}</strong><br />{vehicle.route?.name || "ยังไม่ผูก Route"}<br />{Number(vehicle.latitude).toFixed(5)}, {Number(vehicle.longitude).toFixed(5)}</Popup>
    </CircleMarker>)}
  </MapContainer>;
}
