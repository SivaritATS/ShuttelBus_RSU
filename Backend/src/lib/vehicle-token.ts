import { createHmac, timingSafeEqual } from "node:crypto";

const VEHICLE_TOKEN_SECRET =
  process.env.VEHICLE_TOKEN_SECRET ||
  process.env.SESSION_SECRET ||
  "rsu-shuttle-vehicle-secret-key-2026-secure";

export function generateVehicleToken(vehicleId: number): string {
  const timestamp = Date.now();
  const payload = `${vehicleId}:${timestamp}`;
  const signature = createHmac("sha256", VEHICLE_TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return `vhk_${vehicleId}_${timestamp}_${signature}`;
}

export function verifyVehicleToken(token: string | undefined | null): number | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("_");
  if (parts.length !== 4 || parts[0] !== "vhk") return null;

  const vehicleId = Number(parts[1]);
  const timestamp = Number(parts[2]);
  const signature = parts[3];

  if (!vehicleId || isNaN(vehicleId) || !timestamp || isNaN(timestamp) || !signature) {
    return null;
  }

  // Check expiration: valid for 90 days
  const MAX_TOKEN_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > MAX_TOKEN_AGE_MS || Date.now() < timestamp - 60000) {
    return null;
  }

  const payload = `${vehicleId}:${timestamp}`;
  const expectedSignature = createHmac("sha256", VEHICLE_TOKEN_SECRET)
    .update(payload)
    .digest("hex");

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
    return isValid ? vehicleId : null;
  } catch {
    return null;
  }
}

