const socketPort = process.env.PORT || process.env.SOCKET_PORT || "10000";
const SOCKET_INTERNAL_URL = process.env.SOCKET_INTERNAL_URL || `http://127.0.0.1:${socketPort}`;
const INTERNAL_SECRET =
  process.env.INTERNAL_SOCKET_SECRET || "rsu-shuttle-internal-broadcast-secret-2026";

export async function broadcastLocation(payload: unknown) {
  try {
    await fetch(`${SOCKET_INTERNAL_URL}/api/broadcast/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Socket server may be offline, ignore silently
  }
}

export async function broadcastTrip(payload: unknown) {
  try {
    await fetch(`${SOCKET_INTERNAL_URL}/api/broadcast/trip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Socket server may be offline, ignore silently
  }
}
