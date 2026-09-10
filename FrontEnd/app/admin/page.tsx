import AdminDashboard from "@/components/admin/AdminDashboard";
import SiteHeader from "@/components/layout/SiteHeader";
import { getCurrentUser } from "@backend/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin | Shuttle Bus RSU" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fadmin");
  if (user.role !== "ADMIN") redirect("/explore");
  return <div className="shell"><SiteHeader active="admin" /><AdminDashboard /></div>;
}
