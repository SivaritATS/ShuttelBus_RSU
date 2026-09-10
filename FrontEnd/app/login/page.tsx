import LoginScreen from "@/components/auth/LoginScreen";

export const metadata = { title: "เข้าสู่ระบบ | Shuttle Bus RSU" };

function safeRedirect(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path && path !== "/" && path.startsWith("/") && !path.startsWith("//") ? path : "/explore";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  return <LoginScreen redirectTo={safeRedirect(params.next)} />;
}
