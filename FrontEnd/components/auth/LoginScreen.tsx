import { redirect } from "next/navigation";
import { getCurrentUser } from "@backend/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginScreen({ redirectTo }: { redirectTo: string }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/explore");

  return <main className="auth-shell"><section className="auth-layout">
    <div className="auth-visual">
      <div className="brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5 18.5 5M10 5h8.5v8.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Shuttle Bus RSU</div>
      <h2>Keep the campus moving.</h2>
      <p>พื้นที่สำหรับทีม Admin จัดการเส้นทาง จุดจอด และตำแหน่งรถรับส่งให้ผู้ใช้งานติดตามได้อย่างมั่นใจ</p>
      <ul className="auth-feature-list"><li>อัปเดตตำแหน่งรถแบบเป็นระบบ</li><li>จัดการ Route และจุดจอดจากที่เดียว</li></ul>
    </div>
    <div className="auth-card">
      <div className="auth-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 18.5 18.5 5M10 5h8.5v8.5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div className="eyebrow">Shuttle Bus RSU access</div>
      <h1>เข้าสู่ระบบ</h1>
      <p className="auth-copy">สำหรับเจ้าหน้าที่ที่ได้รับบัญชีจาก Dev เท่านั้น ข้อมูล Public Web สามารถดูได้โดยไม่ต้องเข้าสู่ระบบ</p>
      <LoginForm redirectTo={redirectTo} />
    </div>
  </section></main>;
}
