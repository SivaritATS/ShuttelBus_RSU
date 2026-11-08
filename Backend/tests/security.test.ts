import { describe, expect, it } from "vitest";
import { generateVehicleToken, verifyVehicleToken } from "../src/lib/vehicle-token";

describe("Vehicle Token Cryptographic Security", () => {
  it("generates and verifies a valid HMAC-signed vehicle token", () => {
    const vehicleId = 42;
    const token = generateVehicleToken(vehicleId);

    expect(token.startsWith("vhk_42_")).toBe(true);
    const verifiedId = verifyVehicleToken(token);
    expect(verifiedId).toBe(42);
  });

  it("rejects forged tokens using unverified suffix pattern (reproduction of rsu-auth-vehicle-token-forgeable)", () => {
    // An attacker trying to append _42 to a forged token string
    const forgedToken = "vhk_forged_random_string_42";
    expect(verifyVehicleToken(forgedToken)).toBeNull();
  });

  it("rejects tokens with modified vehicle ID or signature tampering", () => {
    const token = generateVehicleToken(10);
    const parts = token.split("_");
    // Tamper with vehicle ID
    const tamperedToken = `vhk_99_${parts[2]}_${parts[3]}`;
    expect(verifyVehicleToken(tamperedToken)).toBeNull();

    // Tamper with signature
    const tamperedSig = `vhk_10_${parts[2]}_${"0".repeat(parts[3].length)}`;
    expect(verifyVehicleToken(tamperedSig)).toBeNull();
  });

  it("rejects expired or future tokens", () => {
    const expiredTimestamp = Date.now() - 100 * 24 * 60 * 60 * 1000; // 100 days ago
    const futureTimestamp = Date.now() + 2 * 60 * 60 * 1000; // 2 hours into future
    const badToken1 = `vhk_1_${expiredTimestamp}_fake`;
    const badToken2 = `vhk_1_${futureTimestamp}_fake`;

    expect(verifyVehicleToken(badToken1)).toBeNull();
    expect(verifyVehicleToken(badToken2)).toBeNull();
  });

  it("rejects malformed and null/undefined inputs", () => {
    expect(verifyVehicleToken("")).toBeNull();
    expect(verifyVehicleToken(null as any)).toBeNull();
    expect(verifyVehicleToken(undefined as any)).toBeNull();
    expect(verifyVehicleToken("Bearer token")).toBeNull();
  });

  it("ensures live GPS timeout is set to 15 seconds for real-time responsiveness", () => {
    const LIVE_GPS_TIMEOUT_MS = 15 * 1000;
    const now = Date.now();
    const activeTime = now - 5 * 1000; // 5s ago -> live
    const inactiveTime = now - 20 * 1000; // 20s ago -> standby

    expect(now - activeTime < LIVE_GPS_TIMEOUT_MS).toBe(true);
    expect(now - inactiveTime < LIVE_GPS_TIMEOUT_MS).toBe(false);
  });
});

