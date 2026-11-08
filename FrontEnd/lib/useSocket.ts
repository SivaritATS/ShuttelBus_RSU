"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Vehicle } from "@/types";

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  return "https://shuttelbus-rsu-backend.onrender.com";
}

const SOCKET_URL = getSocketUrl();

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
          id: Number(data.vehicleId || data.id),
          name: data.name,
          type: data.type || null,
          routeId: data.routeId || null,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          lastSeenAt: data.lastSeenAt || new Date().toISOString(),
          isActive: true,
          isLive: true,
          driverName: data.driverName || "คนขับออนไลน์",
          speed: typeof data.speed === "number" ? data.speed : Number(data.speed) || 0,
          heading: typeof data.heading === "number" ? data.heading : Number(data.heading) || 0,
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
