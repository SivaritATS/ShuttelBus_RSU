# Shuttle Bus RSU — ระบบติดตามรถราง มหาวิทยาลัยรังสิต

เว็บแอปพลิเคชันสำหรับติดตามตำแหน่งรถรางไฟฟ้าและพิกัดจุดจอด 14 อาคารภายในมหาวิทยาลัยรังสิตแบบ Real-time พร้อมระบบจัดการเส้นทาง จุดจอด และจำลองพิกัด GPS สำหรับ Admin

---

## Tech Stack & Architecture

- **Frontend**: Next.js 16 (Turbopack, App Router), React 19, TypeScript, Vanilla CSS, Leaflet Map
- **Backend & Database**: Next.js Route Handlers, Prisma ORM 6.12, PostgreSQL 16 (PostGIS)
- **Realtime Server**: Socket.IO 4.8
- **Testing**: Vitest 5.0

---

## คำสั่งที่จำเป็นหลัง Clone โปรเจกต์ (Clone & Setup Guide)

เมื่อเพื่อนร่วมทีมหรือคนอื่น Clone โปรเจกต์นี้จาก GitHub ไป สามารถเลือกวิธีการรันได้ 2 รูปแบบตามความสะดวก:

```bash
# 1. Clone โปรเจกต์ และเข้าไปที่โฟลเดอร์
git clone <REPOSITORY_URL>
cd ShuttelBus_RSU

# 2. ติดตั้ง Dependencies
npm install

# 3. .env .example
ให้สร้าง .env ขึ้นมาแล้วก็อบไฟล์จาก .env .example ไปใส่แล้ว config เป็นของตัวเองได้เลย
```

### รูปแบบที่ 1: รันด่วนทันที (Standalone / Mock Mode)
> เหมาะสำหรับผู้ที่ต้องการดูหน้าเว็บ ปรับแต่ง UI หรือค้นหาจุดบนแผนที่ โดย**ไม่จำเป็นต้องเปิด Docker หรือ Database**:
```bash
npm run dev
```
เปิดบราวเซอร์ที่: [http://localhost:3000](http://localhost:3000) (ระบบมี Auto-Fallback ดึงข้อมูลพิกัด 14 จุดและรถรางจากชุด Mockup ขึ้นแสดงทันที 100%)

---

### รูปแบบที่ 2: รันเต็มระบบพร้อม Database จริง และ Realtime Socket
> เหมาะสำหรับผู้ที่ต้องการทดสอบระบบ Database, หน้า Admin, ระบบล็อกอิน และการส่ง GPS สด:

```bash
# 1. รัน Database Container (รองรับทั้ง Mac Apple Silicon, Windows, Linux)
docker compose up -d

# 2. Deploy ตารางฐานข้อมูลทั้งหมด
npm run db:deploy

# 3. ใส่ข้อมูลพิกัด 14 จุด และสายรถรางเริ่มต้น (จาก Mockup)
npm run db:seed

# 4. (ถ้าต้องการสร้าง User เพิ่มเติม สามารถสั่งได้ดังนี้)
npm run db:user -- --username admin --password "admin1234" --role ADMIN

# 5. เริ่มต้นเซิร์ฟเวอร์
npm run realtime   # Terminal 1: รัน Realtime Socket.IO Server (Port 3001)
npm run dev        # Terminal 2: รัน Web Application (Port 3000)
```

---

## รวมคำสั่งที่จำเป็นทั้งหมด (Command Cheat Sheet)

| คำสั่ง | หน้าที่ / คำอธิบาย |
| :--- | :--- |
| `npm install` | ติดตั้ง Node packages ทั้งหมด |
| `npm run dev` | เริ่มต้นเซิร์ฟเวอร์ Development (Next.js Port 3000) |
| `npm run realtime` | เริ่มต้น Socket.IO Server สำหรับพิกัดสด (Port 3001) |
| `npm run build` | สร้าง Production Bundle (Prisma generate + Next.js build) |
| `npm test` | รันชุดการทดสอบ Unit Test (Vitest) |
| `npm run typecheck` | ตรวจสอบความถูกต้องของ TypeScript (0 errors) |
| `npm run db:deploy` | Apply Migrations ทั้งหมดลงใน PostgreSQL |
| `npm run db:seed` | นำเข้าข้อมูลจุดจอด 14 อาคาร, สายรถ และรถรางเข้าสู่ Database |
| `npm run db:studio` | เปิด **Prisma Studio** ที่ [http://localhost:5555](http://localhost:5555) เพื่อดู/แก้ข้อมูลในตาราง |
| `npm run db:user` | สคริปต์สร้าง/อัปเดตรหัสผ่านผู้ใช้งาน (Admin / User) |

---

## มาตรการความปลอดภัยของระบบ (Security & Hardening)

ระบบได้รับการตรวจสอบและปรับปรุงความปลอดภัยตามมาตรฐานความปลอดภัย (Security Audit) เรียบร้อยแล้ว โดยมีมาตรการสำคัญดังนี้:

1. **การปกป้องรหัสผ่านและข้อมูลรับรองผู้ใช้ (Password Security)**
   - ลบคอลัมน์รหัสผ่านแบบ Plaintext ออกจากฐานข้อมูลอย่างถาวร
   - รหัสผ่านทั้งหมดถูกเข้ารหัสด้วย **Bcrypt (Cost factor 12)** และตรวจสอบผ่าน `compare()` เท่านั้น
   - การจัดการ Session ใช้ Token สุ่มความยาว 32 bytes แฮชด้วย SHA-256 และส่งผ่านคุกกี้ที่เปิดแฟล็ก `httpOnly`, `sameSite=lax` และ `secure` เมื่ออยู่บน Production

2. **การป้องกันฐานข้อมูลรั่วไหลสู่ฝั่ง Client (Client-side Asset Protection)**
   - ตัดการ map `DATABASE_URL` ใน `next.config.ts` ออกทั้งหมด ข้อมูล Connection String จึงไม่ถูก compile หรือ Bundle ลงในไฟล์ JavaScript ฝั่งเบราว์เซอร์

3. **การยืนยันตัวตนอุปกรณ์ส่งพิกัดด้วยลายเซ็นดิจิทัล (HMAC-SHA256 Vehicle Tokens)**
   - อุปกรณ์ประจำรถหรือแอปคนขับต้องใช้ Bearer Token ที่ลงนามดิจิทัลด้วย **HMAC-SHA256** (`vhk_<vehicleId>_<timestamp>_<signature>`)
   - ตรวจสอบความถูกต้องของ Signature ด้วย `timingSafeEqual` (Constant-time Comparison) เพื่อป้องกัน Timing Attack
   - Token มีอายุการใช้งาน (Expiration check) และสงวนสิทธิ์การออก Token ให้เฉพาะผู้ดูแลระบบ (`ADMIN`) เท่านั้น

4. **การป้องกันการปลอมพิกัด GPS (Anti-GPS Spoofing & Telemetry Protection)**
   - Endpoint `POST /api/vehicles/location` และ WebSocket event `vehicle:location:update` ต้องมี Vehicle Token หรือ Admin Session
   - มีการตรวจสอบ Binding อย่างเข้มงวดว่า Token ต้องตรงกับ `vehicleId` ของรถคันนั้นจริง ไม่อนุญาตให้ส่งพิกัดแทนรถคันอื่น

5. **การควบคุมสิทธิ์วงจรการเดินรถ (Trip Lifecycle Access Control)**
   - การเริ่มทริป (`/api/trips/start`, `trip:start`) และการจบทริป (`/api/trips/end`, `trip:end`) ต้องยืนยันตัวตนด้วยสิทธิ์ Admin หรือเป็นรถคันที่ได้รับมอบหมายเท่านั้น ป้องกันผู้ไม่หวังดีส่งคำสั่งหยุดทริปหรือสลับสายรถกลางคัน

6. **การป้องกัน Socket Realtime Server และ Webhook ภายใน (Webhook Security)**
   - ป้องกัน Broadcast Webhook ระหว่าง Next.js และ Socket.IO ด้วย Header ลับเฉพาะ `X-Internal-Secret`
   - ยกเลิก Wildcard CORS (`Access-Control-Allow-Origin: *`) บน Webhook ภายใน ป้องกันการยิง Request ข้ามไซต์จากภายนอก

---

## สรุปผลการทดสอบระบบ (Test & Verification Results)

โปรเจกต์นี้ได้รับการทดสอบและตรวจสอบความถูกต้องแล้วในทุกระดับ โดยมีผลสรุปดังนี้:

### 1. Unit & Security Tests (`npm test`) — ผ่านครบ 8/8 รายการ
- **Core Input Validation (3/3 ผ่าน)**:
  - `accepts a valid stop with campus coordinates`: ตรวจสอบความถูกต้องของการรับค่าพิกัดภายในมหาวิทยาลัย
  - `rejects coordinates outside the earth`: ป้องกันและปฏิเสธค่าพิกัดที่อยู่นอกช่วงพิกัดโลก (-90 ถึง 90 และ -180 ถึง 180)
  - `requires a six-digit hex route color`: ตรวจสอบรหัสสีเส้นทางเดินรถให้อยู่ในรูปแบบ Hex Color Code (`#RRGGBB`)
- **Vehicle Token & Cryptographic Security (5/5 ผ่าน)**:
  - `generates and verifies a valid HMAC-signed vehicle token`: สร้างและตรวจสอบ Token ที่มีลายเซ็นดิจิทัลถูกต้อง
  - `rejects forged tokens using unverified suffix pattern`: สกัดกั้นและปฏิเสธการพยายามปลอม Token จากรูปแบบ Suffix
  - `rejects tokens with modified vehicle ID or signature tampering`: ตรวจจับการดัดแปลง Vehicle ID หรือ Signature
  - `rejects expired or future tokens`: ปฏิเสธ Token ที่หมดอายุหรือระบุเวลาผิดปกติ
  - `rejects malformed and null/undefined inputs`: รองรับและดักจับ Input ผิดปกติอย่างปลอดภัย

### 2. Type Checking (`npm run typecheck`) — ผ่าน 100%
- ผ่านการตรวจสอบความปลอดภัยของ Type ด้วย `tsc --noEmit` ไร้ข้อผิดพลาด (0 errors)

### 3. Production Build (`npm run build`) — ผ่านทั้ง 22 Routes
- คอมไพล์สำเร็จทั้ง Static Pages และ Dynamic API Route Handlers 22 routes ด้วย Turbopack

### 4. Database Migrations & Seeding — ผ่านครบ 6 ชุด
- Deploy ครบทั้ง 6 Migrations:
  - `20260906120000_init`
  - `20260910130000_add_auth`
  - `20260910140000_add_vehicle_location`
  - `20260910150000_add_tracking_domain`
  - `20261003130000_add_plain_password_to_user`
  - `20261106200000_drop_plain_password_from_user` (ลบคอลัมน์ plain password ออกเพื่อความปลอดภัยสูงสุด)
- เชื่อมโยง Sequence ของจุดจอด 14 อาคาร ครบถ้วนถูกต้องตั้งแต่ทางเข้าจนถึงทางออก

### 5. Authentication & Access Control Test — ผ่าน 100%
- ทดสอบระบบ Login ด้วย `passwordHash` (Bcrypt) และ Session Cookie ความปลอดภัยสูง
- ระบบ Role-based Access Control (RBAC) ตรวจสอบสิทธิ์ Admin สำหรับการจัดการ Route, Stop, Vehicle และออก Token รถ

### 6. Cross-Platform Compatibility — ทดสอบครอบคลุม
- **macOS (Apple Silicon M1-M4)**: แก้ไขปัญหา Manifest error ด้วย `platform: linux/amd64` ใน `docker-compose.yml` ทำให้เปิด Container ได้ทันที
- **Windows PC & Linux**: สคริปต์ใน `package.json` ปรับเป็นรูปแบบมาตรฐาน Cross-platform
- **Offline Fallback**: หากไม่ได้เปิด Docker เมื่อเรียก API จะดึงข้อมูลจาก [mockup/rsu-campus-data.json](mockup/rsu-campus-data.json) มาแสดงผลโดยอัตโนมัติ

---

## ข้อมูลจุดจอด 14 อาคารที่บันทึกไว้ในระบบ

```text
เรียงตามลำดับเส้นทางเดินรถรอบมหาวิทยาลัย:
1. ทางเข้า (อาคารอุไร)                     (13.964839, 100.587530)
2. ตึก 2 (อาคารวิศวกรรมศาสตร์)              (13.9641728, 100.587568)
3. ตึก 3 (อาคารวิทยาศาสตร์)                 (13.9639947, 100.5871336)
4. ตึก 4 (อาคารกายภาพบำบัด)                (13.9638462, 100.5864097)
5. ตึก 5 (อาคารวิษณุรัตน์)                   (13.9646207, 100.5861076)
6. ตึก 8 (อาคารเทคโนโลยีสารสนเทศ)           (13.9652231, 100.585927)
7. ตึก 9, 10 (หอสมุด - รังสิตประภัสสร)      (13.9659386, 100.5857465)
8. ตึก 12, 13 (ศาลาดนตรี - เฉลิมพระเกียรติ) (13.9667372, 100.585528)
9. ตึก 17 (อาคารภานุรัศมี ทันตแพทย์)        (13.9668052, 100.5833635)
10. ตึก 19, 18 (ศาลากีฬา - สุริยะเทพ)       (13.9688263, 100.583911)
11. ตึก 15 (ดิจิทัลมัลติมีเดียคอมเพล็กซ์)      (13.967794, 100.585149)
12. ตึก 14 (อาคารนวัตกรรม)                  (13.9681782, 100.5872618)
13. ตึก 11 (อาคารรัตนคุณากร)                (13.9664461, 100.5868495)
14. ทางออก (อาคารอุไร)                     (13.965755, 100.587327)
```
*(ดูรายละเอียดข้อมูลดิบและฟังก์ชันค้นหาเพิ่มเติมได้ที่โฟลเดอร์ [mockup/](mockup/))*
