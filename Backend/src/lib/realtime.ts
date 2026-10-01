const SOCKET_INTERNAL_URL = process.env.SOCKET_INTERNAL_URL || "http://127.0.0.1:3001";

export async function broadcastLocation(payload: unknown) {
  try {
    await fetch(`${SOCKET_INTERNAL_URL}/api/broadcast/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Socket server may be offline, ignore silently
  }
}
