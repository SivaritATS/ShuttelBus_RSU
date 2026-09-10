import LoginScreen from "@/components/auth/LoginScreen";

export const metadata = { title: "Login | Shuttle Bus RSU" };

export default function LoginPage() {
  return <LoginScreen redirectTo="/admin" />;
}
