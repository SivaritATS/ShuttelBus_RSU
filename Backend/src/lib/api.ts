import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { message: error.message, ...(error.details ? { details: error.details } : {}) } },
      { status: error.status },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json({ error: { message: "ข้อมูลนี้มีอยู่แล้ว", code: "DUPLICATE" } }, { status: 409 });
    }
    if (error.code === "P2025") {
      return Response.json({ error: { message: "ไม่พบข้อมูลที่ร้องขอ", code: "NOT_FOUND" } }, { status: 404 });
    }
    if (error.code === "P2003") {
      return Response.json({ error: { message: "ข้อมูลที่อ้างอิงไม่ถูกต้อง", code: "INVALID_REFERENCE" } }, { status: 400 });
    }
  }

  console.error(error);
  return Response.json({ error: { message: "เกิดข้อผิดพลาดภายในระบบ", code: "INTERNAL_ERROR" } }, { status: 500 });
}

export async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "รูปแบบ JSON ไม่ถูกต้อง");
  }
}

export function parseId(value: string, label = "ID") {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, `${label} ต้องเป็นจำนวนเต็มบวก`);
  return id;
}

export function withErrorHandling<T extends (...args: any[]) => Promise<Response>>(handler: T) {
  return async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return jsonError(error);
    }
  };
}
