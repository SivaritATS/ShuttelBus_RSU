import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@backend/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginScreen({ redirectTo }: { redirectTo: string }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/explore");

  return <main className="auth-shell"><section className="auth-layout">
    <div className="auth-visual">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <Image
            src="/Bus_icon.png"
            alt="Shuttle Bus RSU Icon"
            width={26}
            height={26}
            className="brand-icon-img"
            priority
          />
        </span>
        Shuttle Bus RSU
      </div>
      <h2>Keep the campus moving.</h2>
      <p>พื้นที่สำหรับทีม Admin จัดการเส้นทาง จุดจอด และตำแหน่งรถรับส่งให้ผู้ใช้งานติดตามได้อย่างมั่นใจ</p>
      <ul className="auth-feature-list"><li>อัปเดตตำแหน่งรถแบบเป็นระบบ</li><li>จัดการ Route และจุดจอดจากที่เดียว</li></ul>
    </div>
    <div className="auth-card">
      <div className="auth-mark" aria-hidden="true">
        <Image
          src="/Bus_icon.png"
          alt="Shuttle Bus RSU Icon"
          width={32}
          height={32}
          className="brand-icon-img"
        />
      </div>
      <div className="eyebrow">Shuttle Bus RSU access</div>
      <h1>เข้าสู่ระบบ</h1>
      <p className="auth-copy">สำหรับเจ้าหน้าที่ที่ได้รับบัญชีจาก Dev เท่านั้น ข้อมูล Public Web สามารถดูได้โดยไม่ต้องเข้าสู่ระบบ</p>
      <LoginForm redirectTo={redirectTo} />
    </div>
  </section></main>;
}
