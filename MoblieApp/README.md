# 🚌 RSU Shuttle Driver Mobile App (Kotlin / Android)

แอปพลิเคชัน Android สำหรับคนขับรถบัส มหาวิทยาลัยรังสิต (RSU Shuttle) พัฒนาด้วย **Kotlin (Jetpack Compose)** ทำหน้าที่ส่งพิกัด GPS ของรถแบบ Realtime ขึ้นสู่ระบบ เพื่อให้ผู้โดยสารบนเว็บไซต์และแอดมินมองเห็นตำแหน่งรถบนแผนที่ได้แบบสดๆ พร้อมความสามารถในการทำงานแบบ **Background / Foreground Service** แม้จะพับหน้าจอหรือเปิดแอปอื่น

---

## 🌟 จุดเด่นและฟังก์ชันการทำงาน

1. **ส่งพิกัดแบบ Hybrid (Socket.IO + REST Fallback):**
   - **Socket.IO (Primary):** สตรีมพิกัด GPS ตรงเข้า Socket Server ด้วย Event `vehicle:location:update` ด้วย Latency ต่ำพิเศษ (< 100ms)
   - **HTTP REST (Fallback):** ส่งผ่าน `POST /api/vehicles/location` อัตโนมัติหากการเชื่อมต่อ Socket ขาดหาย
2. **ระบบ Background Tracking (Foreground Service):**
   - ใช้ `FusedLocationProviderClient` ดึงพิกัดที่มีความแม่นยำสูงทุก 3 วินาที
   - แสดง **Persistent Notification** ในแถบแจ้งเตือนด้านบน ป้องกัน Android OS สั่งปิดแอปตอนพับหน้าจอ (Doze Mode)
   - มีปุ่ม **"หยุดแชร์ตำแหน่ง"** บนแถบ Notification ให้กดหยุดได้ทันทีโดยไม่ต้องเปิดแอป
3. **UI ทันสมัยด้วย Jetpack Compose (Material 3):**
   - มาตรวัดความเร็วแบบดิจิทัลตัวใหญ่ อ่านง่ายขณะขับรถ (km/h)
   - ไฟสถานะ Socket Connection (เชื่อมต่อแล้ว / ออฟไลน์ / กำลังเชื่อม)
   - ข้อมูล Lat, Lng, ทิศทาง (Heading) และจำนวนครั้งที่อัปเดต
4. **โหมดล็อกอินและทดสอบยืดหยุ่น:**
   - ล็อกอินด้วยบัญชีคนขับ (`driver1` / `password`)
   - หรือโหมด Quick Mode: ระบุ `Vehicle ID` และ `Signed Token` ประจำคันได้โดยตรง
5. **หน้า Settings สลับ Server ได้อิสระ:**
   - สลับระหว่าง **Render Cloud** (`https://shuttelbus-rsu-backend.onrender.com`) และ **Local Emulator** (`http://10.0.2.2:3001`) หรือ IP เครื่องคอมพิวเตอร์ของคุณ

---

## 📁 โครงสร้างโปรเจกต์ (`MoblieApp/`)

```text
MoblieApp/
├── app/
│   ├── build.gradle.kts                # ตั้งค่า Android SDK 34, Compose, Dependencies
│   └── src/main/
│       ├── AndroidManifest.xml         # สิทธิ์ GPS, Background, Notification, Service
│       ├── java/com/rsu/shuttle/driver/
│       │   ├── RSUShuttleApp.kt        # Application Entry Point
│       │   ├── MainActivity.kt         # จัดการ Permissions และ Navigation
│       │   ├── data/
│       │   │   ├── api/                # Retrofit HTTP APIs (Login, Fallback, Health)
│       │   │   ├── model/              # Data Classes (User, Vehicle, LocationPayload)
│       │   │   ├── preferences/        # SharedPreferences จัดเก็บ Token และค่าเซิร์ฟเวอร์
│       │   │   └── realtime/           # SocketManager จัดการ Socket.IO และ Event
│       │   ├── service/
│       │   │   └── LocationTrackingService.kt # Foreground Service จับ GPS เบื้องหลัง
│       │   └── ui/
│       │       ├── screens/            # LoginScreen, TrackingScreen, SettingsScreen
│       │       └── theme/              # Color, Type, Theme (Material 3 Dark Palette)
│       └── res/                        # Layout, String, Drawable และ Icons
├── gradle/
│   ├── libs.versions.toml              # Version Catalog จัดการ Library Versions
│   └── wrapper/gradle-wrapper.properties
├── build.gradle.kts
└── settings.gradle.kts
```

---

## 🚀 วิธีเปิดและทดสอบโปรเจกต์ใน Android Studio

### 1. เปิดโปรเจกต์
1. เปิดโปรแกรม **Android Studio**
2. เลือก **File -> Open...** แล้วเลือกไปที่โฟลเดอร์:  
   `ShuttelBus_Project/ShuttelBus_RSU/MoblieApp`
3. รอให้ Android Studio ทำการ **Sync Project with Gradle Files** จนเสร็จ

### 2. รันบน Android Emulator หรือ อุปกรณ์จริง
- **สำหรับ Android Emulator:**
  - สร้าง Device ที่เป็น Android 10 (API 29) ขึ้นไป (แนะนำ Android 13/14, API 33-34)
  - ในหน้า Settings ของแอป ให้เลือก Preset **"Emulator"** (`http://10.0.2.2:3001`) หากรัน Backend ในเครื่องคอมพิวเตอร์ หรือเลือก **"Render Cloud"** หากใช้เซิร์ฟเวอร์บน Cloud
- **สำหรับโทรศัพท์จริง (Physical Device):**
  - เปิด **Developer Options** และ **USB Debugging**
  - หากต้องการเชื่อมต่อ Backend ในเครื่องคอมพิวเตอร์ ให้ตรวจสอบว่าโทรศัพท์ต่อ Wi-Fi วงเดียวกับคอมพิวเตอร์ แล้วใส่ IP ของคอมพิวเตอร์ เช่น `http://192.168.1.xxx:3001` ในหน้า Settings ของแอป

---

## 🔒 การขอสิทธิ์ในแอป (Permissions)
เมื่อเปิดแอปครั้งแรก ระบบจะแสดงหน้าต่างขอสิทธิ์:
1. **Location Permission (ขณะใช้แอป / ตลอดเวลา):** จำเป็นสำหรับการอ่านพิกัด GPS จากเสาสัญญาณและดาวเทียม
2. **Notification Permission (Android 13+):** จำเป็นสำหรับการรัน Background Service เพื่อให้แสดงแถบแจ้งเตือนค้างไว้ตลอดการขับรถ

---

## 📡 สรุปรูปแบบข้อมูลที่ส่งไปยัง Backend

### Socket.IO Event: `vehicle:location:update`
```json
{
  "vehicleId": 1,
  "token": "signed-vehicle-token",
  "latitude": 13.964523,
  "longitude": 100.587211,
  "speed": 32.5,
  "heading": 185.0
}
```
เมื่อส่งพิกัดนี้ขึ้นไป Socket Server ของ RSU Shuttle จะกระจายพิกัดไปยังผู้ใช้หน้าเว็บทันทีอัตโนมัติ!

