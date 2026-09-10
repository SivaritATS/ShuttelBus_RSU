"use client";

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { RouteStop } from "@/types";

function FitBounds({ stops }: { stops: RouteStop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = stops.map(({ stop }) => [Number(stop.latitude), Number(stop.longitude)] as [number, number]);
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
  }, [map, stops]);
  return null;
}

export default function RouteMap({ stops, color }: { stops: RouteStop[]; color: string | null }) {
  const initial = stops.length ? [Number(stops[0].stop.latitude), Number(stops[0].stop.longitude)] as [number, number] : [13.9558, 100.5865] as [number, number];
  return (
    <MapContainer center={initial} zoom={16} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds stops={stops} />
      {stops.map(({ id, stopOrder, stop }) => (
        <CircleMarker key={id} center={[Number(stop.latitude), Number(stop.longitude)]} radius={9} pathOptions={{ color: color || "var(--blue)", fillColor: color || "var(--blue)", fillOpacity: .92, weight: 3 }}>
          <Popup><strong>{stopOrder}. {stop.nameTh}</strong><br />{stop.nameEn || ""}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
