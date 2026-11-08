import { redirect } from "next/navigation";

export default function AdminStopRedirect() {
  redirect("/admin/stops");
}

