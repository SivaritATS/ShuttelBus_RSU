"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/languageContext";

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { lang } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          body?.error?.message ||
          (lang === "en" ? "Sign-in failed. Please verify credentials." : "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล")
        );
      }
      const destination = body?.user?.role === "ADMIN" && redirectTo === "/explore" ? "/admin" : body?.user?.role === "USER" ? "/explore" : redirectTo;
      router.replace(destination);
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : (lang === "en" ? "Sign in failed" : "เข้าสู่ระบบไม่สำเร็จ")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="username">{lang === "en" ? "Username" : "ชื่อผู้ใช้งาน"}</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={lang === "en" ? "Enter username" : "กรอกชื่อผู้ใช้งาน"}
          required
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="password">{lang === "en" ? "Password" : "รหัสผ่าน"}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={lang === "en" ? "Enter password" : "กรอกรหัสผ่าน"}
          required
        />
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>
        {loading
          ? (lang === "en" ? "Signing In…" : "กำลังเข้าสู่ระบบ…")
          : (lang === "en" ? "Sign In" : "เข้าสู่ระบบ")}
      </button>
    </form>
  );
}
