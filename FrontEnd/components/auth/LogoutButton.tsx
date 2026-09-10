"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return <button className="nav-link nav-action" type="button" onClick={logout} disabled={loading}>{loading ? "กำลังออก…" : "ออกจากระบบ"}</button>;
}
