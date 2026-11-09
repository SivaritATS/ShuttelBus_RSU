import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/lib/auth";
import LoginView from "@/components/auth/LoginView";

export default async function LoginScreen({ redirectTo }: { redirectTo: string }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/explore");

  return <LoginView redirectTo={redirectTo} />;
}
