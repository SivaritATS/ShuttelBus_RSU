import { clearAuthSession } from "@backend/lib/auth";
import { withErrorHandling } from "@backend/lib/api";

export const POST = withErrorHandling(async () => {
  await clearAuthSession();
  return Response.json({ ok: true });
});
