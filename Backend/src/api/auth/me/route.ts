import { getCurrentUser } from "@backend/lib/auth";
import { withErrorHandling } from "@backend/lib/api";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
});
