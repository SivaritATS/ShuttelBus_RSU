export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || "เกิดข้อผิดพลาดจาก Backend");
  }

  return response.status === 204 ? (undefined as T) : response.json();
}
