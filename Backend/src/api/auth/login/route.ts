import { authenticate } from "@backend/lib/auth";
import { ApiError, parseJson, withErrorHandling } from "@backend/lib/api";
import { loginSchema, validate } from "@backend/lib/validation";

export const POST = withErrorHandling(async (request: Request) => {
  const body = validate(loginSchema, await parseJson(request));
  const user = await authenticate(body.username, body.password);
  if (!user) throw new ApiError(401, "Username หรือ Password ไม่ถูกต้อง");
  return Response.json({ user });
});
