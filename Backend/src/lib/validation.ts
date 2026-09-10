import { z } from "zod";
import { ApiError } from "./api";

const requiredName = z.string().trim().min(1, "กรุณาระบุชื่อ").max(255);

export const vehicleSchema = z.object({
  name: requiredName,
  type: z.string().trim().max(100).optional().nullable(),
  routeId: z.number().int().positive().optional().nullable(),
  latitude: z.number().min(-90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90").max(90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90").optional().nullable(),
  longitude: z.number().min(-180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180").max(180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180").optional().nullable(),
  isActive: z.boolean().optional(),
});

export const routeSchema = z.object({
  name: requiredName,
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "สีต้องเป็นรูปแบบ #RRGGBB").optional().nullable(),
  isActive: z.boolean().optional(),
});

export const stopSchema = z.object({
  nameTh: requiredName,
  nameEn: z.string().trim().max(255).optional().nullable(),
  latitude: z.number().min(-90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90").max(90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90"),
  longitude: z.number().min(-180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180").max(180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180"),
  imageUrl: z.string().url("imageUrl ต้องเป็น URL").max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const routeStopSchema = z.object({
  stopId: z.number().int().positive(),
  stopOrder: z.number().int().positive().optional(),
});

export const reorderSchema = z.object({
  stopIds: z.array(z.number().int().positive()).min(1, "ต้องมีจุดจอดอย่างน้อย 1 จุด").refine((ids) => new Set(ids).size === ids.length, "จุดจอดซ้ำกันไม่ได้"),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณาระบุ Username").max(100),
  password: z.string().min(1, "กรุณาระบุ Password").max(255),
});

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) details[issue.path.join(".") || "body"] = issue.message;
    throw new ApiError(422, "ข้อมูลไม่ผ่านการตรวจสอบ", details);
  }
  return result.data;
}

export function normalizeOptionalString(value: string | null | undefined) {
  return value?.trim() || null;
}
