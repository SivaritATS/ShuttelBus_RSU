import { describe, expect, it } from "vitest";
import { routeSchema, stopSchema } from "../src/lib/validation";

describe("core input validation", () => {
  it("accepts a valid stop with campus coordinates", () => {
    const result = stopSchema.safeParse({ nameTh: "อาคารเรียนรวม", nameEn: "Academic Complex", latitude: 13.9565, longitude: 100.587 });
    expect(result.success).toBe(true);
  });

  it("rejects coordinates outside the earth", () => {
    const result = stopSchema.safeParse({ nameTh: "Invalid", latitude: 91, longitude: 181 });
    expect(result.success).toBe(false);
  });

  it("requires a six-digit hex route color", () => {
    expect(routeSchema.safeParse({ name: "North", color: "#0F766E" }).success).toBe(true);
    expect(routeSchema.safeParse({ name: "North", color: "teal" }).success).toBe(false);
  });
});
