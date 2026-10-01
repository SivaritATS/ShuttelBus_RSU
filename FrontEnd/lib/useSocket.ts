"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Vehicle } from "@/types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

export function useRealtimeSocket({
  room = "public",
  onLocationUpdate,
  onTripChange,
}: {
  room?: "public" | "admin";
  onLocationUpdate?: (vehicle: Vehicle) => void;
  onTripChange?: (data: { event: string; trip: unknown }) => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Socket.IO Client] Connected to ${SOCKET_URL}, joining room: ${room}`);
      setIsConnected(true);
      socket.emit("join", room);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO Client] Disconnected");
      setIsConnected(false);
    });

    socket.on("vehicle:location", (data: any) => {
      if (onLocationUpdate && data) {
        onLocationUpdate({
          id: data.vehicleId || data.id,
          name: data.name,
          type: data.type || null,
          routeId: data.routeId || null,
          latitude: data.latitude,
          longitude: data.longitude,
          lastSeenAt: data.lastSeenAt || new Date().toISOString(),
          isActive: true,
          speed: data.speed,
          heading: data.heading,
          tripId: data.tripId,
          route: data.route || null,
        });
      }
    });

    socket.on("trip:change", (data: any) => {
      if (onTripChange && data) {
        onTripChange(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [room]);

  // ฟังก์ชันจำลองการส่งพิกัดรถผ่าน Socket (สำหรับทดสอบ / Driver mobile mockup)
  const sendLocationUpdate = (payload: {
    vehicleId: number;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    tripId?: number;
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("vehicle:location:update", payload);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendLocationUpdate,
  };
}
