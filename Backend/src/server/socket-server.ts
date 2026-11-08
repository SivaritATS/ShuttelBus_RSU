import "dotenv/config";
import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { generateVehicleToken, verifyVehicleToken } from "../lib/vehicle-token";

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || process.env.SOCKET_PORT || 10000);
const HOST = process.env.SOCKET_HOST || "0.0.0.0";
const INTERNAL_SECRET =
  process.env.INTERNAL_SOCKET_SECRET || "rsu-shuttle-internal-broadcast-secret-2026";

function verifyInternalSecret(headerValue: string | string[] | undefined): boolean {
  if (!headerValue || typeof headerValue !== "string") return false;
  if (headerValue.length !== INTERNAL_SECRET.length) return false;
  try {
    return timingSafeEqual(Buffer.from(headerValue), Buffer.from(INTERNAL_SECRET));
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  // Global CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-vehicle-token, x-internal-secret");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoints
  if (req.url === "/health" || req.url === "/api/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "rsu-shuttle-realtime-socket", database: "connected", timestamp: new Date() }));
    return;
  }

  // REST API Login for Mobile / Web clients
  if (req.url === "/api/auth/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { username, password } = JSON.parse(body || "{}");
        if (!username || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "กรุณาระบุ Username และ Password" } }));
          return;
        }

        const user = await prisma.user.findUnique({
          where: { username: username.trim().toLowerCase() },
        });

        if (!user || !user.isActive) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "Username หรือ Password ไม่ถูกต้อง" } }));
          return;
        }

        const isMatch = await compare(password, user.passwordHash).catch(() => false);
        if (!isMatch) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "Username หรือ Password ไม่ถูกต้อง" } }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "เกิดข้อผิดพลาดภายในระบบ" } }));
      }
    });
    return;
  }

  // REST API: Get Vehicle Token
  if (req.url === "/api/auth/vehicle" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { vehicleId, name } = JSON.parse(body || "{}");
        const vehicle = await prisma.vehicle.findFirst({
          where: {
            ...(vehicleId ? { id: Number(vehicleId) } : {}),
            ...(name ? { name } : {}),
            isActive: true,
          },
          include: { route: true },
        });

        if (!vehicle) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "ไม่พบข้อมูลรถในระบบ หรือรถถูกระงับการใช้งาน" } }));
          return;
        }

        const token = generateVehicleToken(vehicle.id);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: true,
          token,
          vehicle: {
            id: vehicle.id,
            name: vehicle.name,
            type: vehicle.type,
            routeId: vehicle.routeId,
            route: vehicle.route,
            isActive: vehicle.isActive,
          },
        }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "เกิดข้อผิดพลาดในการออกสิทธิ์รถ" } }));
      }
    });
    return;
  }

  // REST API: Get Active Vehicle Locations
  if (req.url === "/api/vehicles/locations" && req.method === "GET") {
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

      const now = Date.now();
      const LIVE_GPS_TIMEOUT_MS = 3 * 60 * 1000;
      const enriched = vehicles.map((v) => {
        const lastSeenTime = v.lastSeenAt ? new Date(v.lastSeenAt).getTime() : 0;
        const isLive = Boolean(lastSeenTime && (now - lastSeenTime) < LIVE_GPS_TIMEOUT_MS);
        return {
          ...v,
          isLive,
        };
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(enriched));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch vehicle locations" }));
    }
    return;
  }

  // HTTP webhook สำหรับให้ REST API ส่งสัญญาณ broadcast ข้ามมา socket
  // ป้องกันด้วย Internal Secret Header (ไม่มี Wildcard CORS)
  if (req.url?.startsWith("/api/broadcast/")) {
    if (req.method === "OPTIONS") {
      res.writeHead(405);
      res.end();
      return;
    }

    const secretHeader = req.headers["x-internal-secret"];
    if (!verifyInternalSecret(secretHeader)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized: Invalid or missing X-Internal-Secret header" }));
      return;
    }

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
  }

  // HTTP REST Location update fallback for Mobile
  if (req.url === "/api/vehicles/location" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const token = (payload.token || req.headers["x-vehicle-token"]) as string;
        const verifiedVehicleId = verifyVehicleToken(token);
        if (!verifiedVehicleId || verifiedVehicleId !== Number(payload.vehicleId)) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "Unauthorized: Invalid or expired vehicle token" } }));
          return;
        }

        const now = new Date();
        const updatedVehicle = await prisma.vehicle.update({
          where: { id: verifiedVehicleId },
          data: {
            latitude: Number(payload.latitude),
            longitude: Number(payload.longitude),
            lastSeenAt: now,
          },
          include: {
            route: { select: { id: true, name: true, color: true } },
          },
        });

        const broadcastPayload = {
          id: updatedVehicle.id,
          vehicleId: updatedVehicle.id,
          name: updatedVehicle.name,
          type: updatedVehicle.type,
          routeId: updatedVehicle.routeId,
          latitude: Number(updatedVehicle.latitude),
          longitude: Number(updatedVehicle.longitude),
          lastSeenAt: updatedVehicle.lastSeenAt,
          speed: payload.speed || 0,
          heading: payload.heading || 0,
          tripId: payload.tripId || null,
          isLive: true,
          driverName: payload.driverName || "คนขับออนไลน์",
          route: updatedVehicle.route,
        };

        io.to("public").to("admin").emit("vehicle:location", broadcastPayload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, vehicle: broadcastPayload }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "Invalid payload or server error" } }));
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

  // รถลงทะเบียน socket ประจำคัน (ต้องส่ง token ที่ลงนามแล้ว)
  socket.on("vehicle:register", (data: { vehicleId: number; token?: string; name?: string; driverName?: string }) => {
    if (!data?.vehicleId || !data?.token) {
      socket.emit("vehicle:error", { message: "Missing vehicleId or token" });
      return;
    }
    const verifiedVehicleId = verifyVehicleToken(data.token);
    if (!verifiedVehicleId || verifiedVehicleId !== Number(data.vehicleId)) {
      socket.emit("vehicle:error", { message: "Unauthorized: Invalid or expired vehicle token" });
      return;
    }

    socket.data.vehicleId = verifiedVehicleId;
    if (data.driverName) {
      socket.data.driverName = data.driverName;
    }
    socket.join("vehicles");
    socket.join(`vehicle:${data.vehicleId}`);
    console.log(`[Socket.io] Vehicle registered: ID ${data.vehicleId} (${socket.id}) by ${data.driverName || "driver"}`);
    socket.emit("vehicle:registered", { vehicleId: verifiedVehicleId, socketId: socket.id });
  });

  // รับการอัปเดตพิกัดจากรถ/Mobile ผ่าน WebSocket
  socket.on(
    "vehicle:location:update",
    async (data: {
      vehicleId: number;
      token?: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      tripId?: number;
      driverName?: string;
    }) => {
      try {
        const { vehicleId, token, latitude, longitude, speed, heading, tripId, driverName } = data;

        // ตรวจสอบความถูกต้องของสิทธิ์การส่งพิกัดรถ
        const authedVehicleId = socket.data.vehicleId || (token ? verifyVehicleToken(token) : null);
        if (!authedVehicleId || authedVehicleId !== Number(vehicleId)) {
          socket.emit("vehicle:location:error", {
            message: "Unauthorized: Invalid, missing, or mismatched vehicle token",
          });
          return;
        }

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

        const activeDriver = driverName || socket.data.driverName || "คนขับออนไลน์";

        const locationPayload = {
          id: updatedVehicle.id,
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
          isLive: true,
          driverName: activeDriver,
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
  socket.on("trip:start", async (data: { vehicleId: number; routeId: number; token?: string }) => {
    try {
      const authedVehicleId = socket.data.vehicleId || (data?.token ? verifyVehicleToken(data.token) : null);
      if (!authedVehicleId || authedVehicleId !== Number(data.vehicleId)) {
        socket.emit("trip:error", { message: "Unauthorized: Invalid or mismatched vehicle token" });
        return;
      }

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
  socket.on("trip:end", async (data: { tripId: number; token?: string }) => {
    try {
      if (!data?.tripId) {
        socket.emit("trip:error", { message: "Missing tripId" });
        return;
      }

      const existingTrip = await prisma.trip.findUnique({
        where: { id: Number(data.tripId) },
      });

      if (!existingTrip) {
        socket.emit("trip:error", { message: "Trip not found" });
        return;
      }

      const authedVehicleId = socket.data.vehicleId || (data?.token ? verifyVehicleToken(data.token) : null);
      if (!authedVehicleId || authedVehicleId !== existingTrip.vehicleId) {
        socket.emit("trip:error", { message: "Unauthorized: Only the assigned vehicle can end this trip" });
        return;
      }

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

server.listen(PORT, HOST, () => {
  console.log(`[RSU Shuttle Realtime Server] Socket.IO listening on ${HOST}:${PORT}`);
});
