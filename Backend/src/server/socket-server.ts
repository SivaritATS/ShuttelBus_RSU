import "dotenv/config";
import http from "node:http";
import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = process.env.SOCKET_PORT ? Number(process.env.SOCKET_PORT) : 3001;

const server = http.createServer(async (req, res) => {
  // ตั้งค่า CORS headers สำหรับ HTTP API endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "rsu-shuttle-realtime-socket", timestamp: new Date() }));
    return;
  }

  // HTTP webhook สำหรับให้ REST API ส่งสัญญาณ broadcast ข้ามมา socket
  if (req.url === "/api/broadcast/location" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        io.to("public").to("admin").emit("vehicle:location", payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, broadcasted: payload }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (req.url === "/api/broadcast/trip" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        io.to("public").to("admin").emit("trip:change", payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, broadcasted: payload }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

io.on("connection", (socket: Socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // เข้าร่วมห้องตามบทบาท
  socket.on("join", (room: "public" | "admin" | "vehicle") => {
    socket.join(room);
    console.log(`[Socket.io] Socket ${socket.id} joined room: ${room}`);
    socket.emit("joined", { room, socketId: socket.id });
  });

  // รถลงทะเบียน socket ประจำคัน
  socket.on("vehicle:register", (data: { vehicleId: number; name?: string }) => {
    socket.join("vehicles");
    socket.join(`vehicle:${data.vehicleId}`);
    console.log(`[Socket.io] Vehicle registered: ID ${data.vehicleId} (${socket.id})`);
  });

  // รับการอัปเดตพิกัดจากรถ/Mobile ผ่าน WebSocket
  socket.on(
    "vehicle:location:update",
    async (data: {
      vehicleId: number;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      tripId?: number;
    }) => {
      try {
        const { vehicleId, latitude, longitude, speed, heading, tripId } = data;
        const now = new Date();

        // 1. บันทึกลงตาราง Vehicle
        const updatedVehicle = await prisma.vehicle.update({
          where: { id: vehicleId },
          data: {
            latitude,
            longitude,
            lastSeenAt: now,
          },
          include: {
            route: { select: { id: true, name: true, color: true } },
          },
        });

        // 2. บันทึกลงตาราง GpsTrack สำหรับประวัติเส้นทาง
        await prisma.gpsTrack.create({
          data: {
            vehicleId,
            tripId: tripId || null,
            latitude,
            longitude,
            speed: speed !== undefined ? speed : null,
            heading: heading !== undefined ? heading : null,
            recordedAt: now,
          },
        });

        const locationPayload = {
          vehicleId: updatedVehicle.id,
          name: updatedVehicle.name,
          type: updatedVehicle.type,
          routeId: updatedVehicle.routeId,
          latitude: Number(updatedVehicle.latitude),
          longitude: Number(updatedVehicle.longitude),
          lastSeenAt: updatedVehicle.lastSeenAt,
          speed: speed || 0,
          heading: heading || 0,
          tripId: tripId || null,
          route: updatedVehicle.route,
        };

        // 3. Broadcast ไปยังผู้ใช้งาน Public และ Admin ทันที!
        io.to("public").to("admin").emit("vehicle:location", locationPayload);
        // และ emit กลับไปยืนยันกับรถ
        socket.emit("vehicle:location:ack", { success: true, timestamp: now });
      } catch (error) {
        console.error("[Socket.io] Error updating vehicle location:", error);
        socket.emit("vehicle:location:error", {
          message: error instanceof Error ? error.message : "Update location failed",
        });
      }
    }
  );

  // เริ่มต้นทริป (Start Trip) ผ่าน Socket
  socket.on("trip:start", async (data: { vehicleId: number; routeId: number }) => {
    try {
      const now = new Date();
      const trip = await prisma.trip.create({
        data: {
          vehicleId: data.vehicleId,
          routeId: data.routeId,
          startedAt: now,
          status: "IN_PROGRESS",
        },
        include: {
          vehicle: true,
          route: true,
        },
      });

      // ผูกรถเข้ากับสายนี้
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { routeId: data.routeId },
      });

      io.to("public").to("admin").emit("trip:change", { event: "started", trip });
      socket.emit("trip:start:ack", { success: true, trip });
    } catch (err) {
      socket.emit("trip:error", { message: "Could not start trip" });
    }
  });

  // จบทริป (End Trip) ผ่าน Socket
  socket.on("trip:end", async (data: { tripId: number }) => {
    try {
      const now = new Date();
      const trip = await prisma.trip.update({
        where: { id: data.tripId },
        data: {
          endedAt: now,
          status: "COMPLETED",
        },
        include: { vehicle: true, route: true },
      });

      io.to("public").to("admin").emit("trip:change", { event: "ended", trip });
      socket.emit("trip:end:ack", { success: true, trip });
    } catch (err) {
      socket.emit("trip:error", { message: "Could not end trip" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`[RSU Shuttle Realtime Server] Socket.IO listening on port ${PORT}`);
});
