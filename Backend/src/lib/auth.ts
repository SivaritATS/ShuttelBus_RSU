import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./api";

export const SESSION_COOKIE_NAME = "shuttle_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toAuthUser(user: { id: number; username: string; role: UserRole }): AuthUser {
  return { id: user.id, username: user.username, role: user.role };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashSessionToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    await prisma.session.deleteMany({ where: { id: hashSessionToken(token) } });
    return null;
  }

  return toAuthUser(session.user);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "กรุณาเข้าสู่ระบบก่อนใช้งาน");
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (user.role !== role) throw new ApiError(403, "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้");
  return user;
}

export async function authenticate(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username: normalizeUsername(username) } });
  if (!user || !user.isActive || !(await compare(password, user.passwordHash))) return null;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.session.create({ data: { id: hashSessionToken(token), userId: user.id, expiresAt } });

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return toAuthUser(user);
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashSessionToken(token) } });
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function hashPassword(password: string) {
  return hash(password, 12);
}

// Vehicle Token Authentication สำหรับ Mobile App และ Driver App
export async function authenticateVehicle(identifier: { vehicleId?: number; name?: string }) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      ...(identifier.vehicleId ? { id: identifier.vehicleId } : {}),
      ...(identifier.name ? { name: identifier.name } : {}),
      isActive: true,
    },
    include: { route: true },
  });

  if (!vehicle) return null;

  // สร้าง device token
  const token = `vhk_${randomBytes(24).toString("hex")}_${vehicle.id}`;
  return { token, vehicle };
}

export async function requireVehicleAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "กรุณาส่ง Vehicle Authorization Token (Bearer token)");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const parts = token.split("_");
  const vehicleId = Number(parts[parts.length - 1]);

  if (isNaN(vehicleId)) {
    throw new ApiError(401, "Invalid vehicle token format");
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId, isActive: true },
    include: { route: true },
  });

  if (!vehicle) {
    throw new ApiError(401, "Vehicle not found or inactive");
  }

  return vehicle;
}
