# Shuttle Bus RSU — ระบบติดตามรถราง มหาวิทยาลัยรังสิต

ระบบติดตามตำแหน่งรถรางและจุดจอดภายในมหาวิทยาลัยรังสิตแบบ Real-time (RSU Campus Shuttle & Stop Tracking System) พัฒนาด้วย Next.js และ Node.js รองรับทั้งการดูเส้นทางและตำแหน่งรถสำหรับนักศึกษา/บุคลากรทั่วไป และแดชบอร์ดจัดการข้อมูลสำหรับผู้ดูแลระบบ (Admin)

---

## ฟีเจอร์หลัก (Features)

- **Interactive Campus Map**: แผนที่วิทยาเขต ม.รังสิต แบบโต้ตอบได้ พร้อมหมุดจุดจอด 14 จุดหลัก และเส้นทางเดินรถตามพิกัดจริง
- **Realtime Vehicle Tracking**: ติดตามตำแหน่งรถรางแบบเรียลไทม์ผ่าน Socket.IO (พอร์ต 3001) พร้อมระบบ Fallback Polling อัตโนมัติเมื่อขาดการเชื่อมต่อ
- **Light & Dark Mode**: รองรับธีมสว่างและธีมมืด พร้อมจดจำค่าผ่าน `localStorage`
- **Route & Stop Management**: รองรับสายเดินรถหลากหลาย เช่น Main Campus Loop, North-South Line, Express Line พร้อมจุดจอดครอบคลุมทั่ววิทยาเขต
- **Role-Based Authentication**: ระบบความปลอดภัยแยกสิทธิ์ `ADMIN` และ `USER` เข้ารหัสผ่านด้วย `bcryptjs` และจัดการเซสชันผ่าน HttpOnly Cookie
- **Admin Dashboard**: แดชบอร์ดจัดการข้อมูล เพิ่ม/ลบ/แก้ไข/เรียงลำดับจุดจอด สายรถ และอัปเดตตำแหน่งพิกัด GPS ของรถราง
- **Responsive Layout**: รองรับการใช้งานทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ทโฟน

---

## เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนของระบบ | เทคโนโลยี |
|---|---|
| Frontend Framework | Next.js 15 (App Router) + React 19 |
| Language & Typing | TypeScript |
| Styling & Theme | Vanilla CSS + CSS Custom Properties (Tokens) |
| Interactive Map | Leaflet + React Leaflet 5 |
| Realtime Engine | Socket.io (Client & Server) |
| Backend & Validation | Next.js API Routes + Zod |
| ORM & Database | Prisma ORM + PostgreSQL 16 (PostGIS) |
| Containerization | Docker & Docker Compose |
| Testing | Vitest |

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
ShuttelBus_RSU/
├── Backend/                    # แกนประมวลผลฝั่ง Backend และฐานข้อมูล
│   ├── prisma/
│   │   ├── schema.prisma       # สกีมาฐานข้อมูล (Vehicles, Routes, Stops, Users, Sessions)
│   │   ├── migrations/         # ประวัติ Database Migrations
│   │   ├── seed.ts             # ข้อมูลเริ่มต้น (จุดจอด ม.รังสิต 14 ตึก, เส้นทาง, ข้อมูลรถ)
│   │   └── create-user.ts      # สคริปต์สร้าง/รีเซ็ตบัญชีผู้ใช้
│   ├── src/
│   │   ├── api/                # REST API Handlers และ Validation Logic
│   │   ├── lib/                # Prisma client, Auth helpers, Session management
│   │   └── server/
│   │       └── socket-server.ts# Socket.IO Server สำหรับบรอดแคสต์ตำแหน่งรถสด
│   └── tests/                  # ชุดทดสอบ Unit/Integration Tests
│
├── FrontEnd/                   # เว็บแอปพลิเคชัน Next.js (App Router)
│   ├── app/                    # Pages & Route Handlers
│   │   ├── (public)/           # หน้าเว็บสาธารณะ (หน้าแรก / และ /explore)
│   │   ├── (auth)/login/       # หน้าเข้าสู่ระบบ (/login)
│   │   ├── admin/              # หน้าควบคุมจัดการสำหรับ Admin (/admin)
│   │   ├── api/                # Next.js API Route Adapters เชื่อมต่อไปยัง Backend
│   │   ├── globals.css         # สไตล์หลักและตัวแปรธีม (Light/Dark Tokens)
│   │   └── layout.tsx          # Root Layout, Metadata, Favicon
│   ├── components/             # React Components แบ่งตามโมดูล
│   │   ├── admin/              # Dashboard, ตาราง และแบบฟอร์ม Admin
│   │   ├── auth/               # หน้าล็อกอินและแบบฟอร์มตรวจสอบสิทธิ์
│   │   ├── layout/             # SiteHeader, ThemeToggle
│   │   ├── map/                # CampusLiveMap, VehicleMap
│   │   └── public/             # Public Explorer, Route Selector, Stop List
│   ├── picture/                # ไฟล์รูปภาพต้นฉบับ (Bus_icon.png)
│   ├── public/                 # Static Assets (Favicon, Web Icons)
│   └── types/                  # Frontend TypeScript Types
│
├── docker-compose.yml          # คอนฟิก PostgreSQL + PostGIS Container (พอร์ต 5433:5432)
├── package.json                # สคริปต์และ Dependency ทั้งหมดของโปรเจกต์
└── README.md                   # คู่มือการใช้งานระบบ
```

---

## ขั้นตอนการติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
- Node.js (เวอร์ชัน 18 ขึ้นไป แนะนำ v20 หรือ v22)
- Docker Desktop (สำหรับรันฐานข้อมูล PostgreSQL/PostGIS)

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables (`.env`)
ตรวจสอบหรือสร้างไฟล์ `.env` ที่โฟลเดอร์รูทของโปรเจกต์:
```env
DATABASE_URL="postgresql://shuttle:shuttle_dev@127.0.0.1:5433/university_shuttle_tracking?schema=public"
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### 4. รันฐานข้อมูลผ่าน Docker
```bash
docker compose up -d
```
> ตรวจสอบว่า Container `university-shuttle-db` รันสำเร็จบนพอร์ต `5433`

### 5. ทำการ Migrate และใส่ข้อมูลเริ่มต้น (Database Migration & Seed)
```bash
# อัปเดตสกีมาฐานข้อมูล
npm run db:deploy

# นำเข้าข้อมูลเริ่มต้นจุดจอด 14 อาคารของ ม.รังสิต และสายรถ
npm run db:seed
```

### 6. สร้างบัญชีผู้ดูแลระบบ (Create Admin Account)
```bash
# ตัวอย่าง: สร้างบัญชี Admin
npm run db:user -- --username admin --password "admin1234" --role ADMIN

# ตัวอย่าง: สร้างบัญชี Staff
npm run db:user -- --username staff --password "staff1234" --role USER
```

### 7. รันเซิร์ฟเวอร์ (Development)

เปิดรันเว็บแอปพลิเคชัน Next.js:
```bash
npm run dev
```

(ทางเลือก) หากต้องการเปิดเซิร์ฟเวอร์ Realtime พิกัดผ่าน Socket.IO:
```bash
npm run realtime
```

---

## หน้าเว็บและการเข้าใช้งาน (URLs & Access)

| หน้าเว็บ | URL | สิทธิ์การเข้าถึง | รายละเอียด |
|---|---|---|---|
| หน้าหลัก (Public Web) | [http://localhost:3000](http://localhost:3000) | ทุกคน | แผนที่สด ติดตามตำแหน่งรถราง ค้นหาจุดจอด และสายรถ |
| หน้าสำรวจเส้นทาง | [http://localhost:3000/explore](http://localhost:3000/explore) | ทุกคน | หน้าสำรวจสายรถและป้ายหยุดทั้งหมด |
| หน้าเข้าสู่ระบบ | [http://localhost:3000/login](http://localhost:3000/login) | ทุกคน | เข้าสู่ระบบสำหรับเจ้าหน้าที่และ Admin |
| ระบบจัดการ Admin | [http://localhost:3000/admin](http://localhost:3000/admin) | เฉพาะ ADMIN | จัดการสายรถ จุดจอด และรถราง |

---

## สรุปรายการ REST API

| โมดูล | Method & Path | รายละเอียด |
|---|---|---|
| Health | `GET /api/health` | ตรวจสอบสถานะการทำงานของระบบ |
| Auth | `POST /api/auth/login` | เข้าสู่ระบบ |
| | `POST /api/auth/logout` | ออกจากระบบ และลบ Session Cookie |
| | `GET /api/auth/me` | ดึงข้อมูลผู้ใช้ปัจจุบันจากเซสชัน |
| Vehicles | `GET /api/vehicles` | รายการรถรางทั้งหมด |
| | `GET /api/vehicles/locations` | ดึงพิกัดล่าสุดของรถรางทุกคัน (สำหรับ Live Tracking) |
| | `POST /api/vehicles` | เพิ่มรถรางใหม่ (ต้องเป็น Admin) |
| | `GET /api/vehicles/:id` | ดูข้อมูลรถรายคัน |
| | `PATCH /api/vehicles/:id` | แก้ไขข้อมูลหรืออัปเดตพิกัดรถราง |
| | `DELETE /api/vehicles/:id` | ลบข้อมูลรถราง |
| Routes | `GET /api/routes` | รายการสายรถทั้งหมด (รองรับ query `?active=true`) |
| | `POST /api/routes` | สร้างสายรถใหม่ |
| | `GET /api/routes/:id` | รายละเอียดสายรถ |
| | `PATCH /api/routes/:id` | แก้ไขชื่อ สี หรือสถานะสายรถ |
| | `DELETE /api/routes/:id` | ลบสายรถ |
| Stops | `GET /api/stops` | รายการจุดจอดทั้งหมด |
| | `POST /api/stops` | เพิ่มจุดจอดใหม่ พร้อมพิกัด Latitude, Longitude |
| | `GET /api/stops/:id` | ดูข้อมูลจุดจอด |
| | `PATCH /api/stops/:id` | แก้ไขจุดจอด |
| | `DELETE /api/stops/:id` | ลบจุดจอด |
| Route Stops | `GET /api/routes/:id/stops` | จุดจอดที่ผูกกับสายรถ เรียงตามลำดับ |
| | `POST /api/routes/:id/stops` | ผูกจุดจอดเข้ากับสายรถ |
| | `PATCH /api/routes/:id/stops/reorder` | สลับและบันทึกลำดับป้ายจอดใหม่ |
| | `DELETE /api/routes/:id/stops/:stopId` | ยกเลิกการผูกจุดจอดออกจากสายรถ |

---

## คำสั่ง NPM Scripts

```bash
# รัน Frontend Next.js โหมด Development
npm run dev

# รัน Realtime Socket.IO Server
npm run realtime

# ตรวจสอบ TypeScript Types ทั้งโปรเจกต์
npm run typecheck

# รัน Unit Tests และ Validation Tests ด้วย Vitest
npm test

# Build โปรเจกต์สำหรับ Production
npm run build

# รัน Production Server หลัง Build
npm run start

# ซิงค์สกีมา Prisma ไปยังฐานข้อมูล (Development)
npm run db:migrate

# รัน Migrations ไปยังฐานข้อมูล (Production / Deployment)
npm run db:deploy

# ใส่ข้อมูลเริ่มต้น (จุดจอด 14 อาคาร, เส้นทาง, ตำแหน่งรถจำลอง)
npm run db:seed

# สร้างหรือเปลี่ยนรหัสผ่านผู้ใช้งาน
npm run db:user -- --username <user> --password <pass> --role <ADMIN|USER>
```

---

## ข้อมูลจุดจอดเริ่มต้น มหาวิทยาลัยรังสิต (RSU Stops)

ระบบบันทึกจุดจอดพิกัดตามจริงภายในมหาวิทยาลัยรังสิตไว้ 14 จุดหลัก:
1. ทางเข้า (อาคารอุไร)
2. ตึก 2
3. ตึก 3
4. ตึก 4
5. ตึก 5
6. ตึก 8
7. ตึก 9, 10
8. ตึก 11
9. ตึก 12
10. ตึก 14
11. ตึก 15
12. ตึก 17
13. ตึก 19, 18
14. ทางออก (อาคารอุไร)

---

## การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

1. **Docker Daemon Connection Error:**
   - ตรวจสอบว่าเปิดโปรแกรม Docker Desktop เรียบร้อยแล้วก่อนสั่ง `docker compose up -d`
2. **พอร์ตฐานข้อมูล 5433 ชนกับแอปพลิเคชันอื่น:**
   - คอนฟิกใน `docker-compose.yml` กำหนดพอร์ตไว้ที่ `5433:5432` เพื่อหลีกเลี่ยงการชนกับ PostgreSQL ทั่วไป หากต้องการเปลี่ยนพอร์ต ให้แก้ไขทั้งใน `.env` และ `docker-compose.yml` ให้ตรงกัน
3. **การล้างแคชไอคอนและสไตล์บนเบราว์เซอร์:**
   - หากไอคอนหรือสไตล์ยังไม่เปลี่ยน ให้กด `Ctrl + Shift + R` (หรือ `Ctrl + F5`) บนเบราว์เซอร์เพื่อ Hard Refresh
