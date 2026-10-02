# Shuttle Bus RSU — ระบบติดตามรถราง ม.รังสิต

เว็บแอปพลิเคชันสำหรับติดตามตำแหน่งรถรางและจุดจอดภายในมหาวิทยาลัยรังสิตแบบ Real-time พร้อมระบบจัดการเส้นทางและจุดจอดสำหรับ Admin

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Vanilla CSS, Leaflet
- **Backend & Database**: Next.js API Routes, Prisma ORM, PostgreSQL (PostGIS)
- **Realtime**: Socket.IO

---

## ขั้นตอนการติดตั้งและรันระบบ (Setup & Run)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
คัดลอกไฟล์ตัวอย่าง `.env.example` เป็น `.env` และกำหนดค่าคอนฟิกของคุณ:
```bash
cp .env.example .env
```

### 3. รันฐานข้อมูล (Docker)
```bash
docker compose up -d
```

### 4. เตรียมฐานข้อมูลและข้อมูลเริ่มต้น
```bash
npm run db:deploy
npm run db:seed
```

### 5. สร้างบัญชีผู้ใช้งาน (Admin / Staff)
```bash
# ตัวอย่าง: สร้างบัญชี Admin (กำหนดรหัสผ่านของคุณเอง)
npm run db:user -- --username admin --password "<YOUR_PASSWORD>" --role ADMIN
```

### 6. เริ่มการทำงานของระบบ
```bash
# รันหน้าเว็บ Next.js (http://localhost:3000)
npm run dev

# (เปิดอีก Terminal) รัน Realtime Socket.IO Server (http://localhost:3001)
npm run realtime
```

---

## หน้าเว็บหลัก (Pages)

- **หน้าแผนที่สด (Public Web)**: [http://localhost:3000](http://localhost:3000)
- **หน้าเข้าสู่ระบบ (Login)**: [http://localhost:3000/login](http://localhost:3000/login)
- **แดชบอร์ดจัดการระบบ (Admin Dashboard)**: [http://localhost:3000/admin](http://localhost:3000/admin) (ต้องล็อกอินด้วยสิทธิ์ ADMIN)

---

## คำสั่งที่ใช้บ่อย (Useful Commands)

```bash
npm run dev        # รันเว็บในโหมด Development
npm run realtime   # รัน Socket.IO server
npm run typecheck  # ตรวจสอบ TypeScript errors
npm test           # รันเทสต์
npm run build      # บิลด์สำหรับ Production
npm run db:migrate # สร้าง migration ใหม่เมื่อแก้ schema.prisma
```
