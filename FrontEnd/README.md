# FrontEnd editing guide

โครงสร้างหน้าเว็บถูกแยกตามหน้าที่ เพื่อให้แก้ UX/UI ได้ง่ายขึ้น โดย URL เดิมยังใช้งานเหมือนเดิม

## Pages

```text
app/
├── (public)/              # หน้าผู้ใช้ทั่วไป: / และ /explore
├── (auth)/login/          # หน้าเข้าสู่ระบบ: /login
├── admin/                 # หน้าเจ้าหน้าที่: /admin
└── api/                   # Route adapter ของ Next.js API
```

## Public UI

แก้ส่วนต่าง ๆ ของหน้า Public ได้จากไฟล์เหล่านี้:

```text
components/public/
├── PublicHome.tsx
├── PublicExplorer.tsx              # จัดการ state และโหลดข้อมูล
└── sections/
    ├── PublicHero.tsx              # Hero ด้านบน
    ├── LiveVehicleTrackingSection.tsx
    ├── RouteNetworkSection.tsx
    └── RouteStopsSection.tsx
```

## Admin UI

```text
components/admin/
├── AdminDashboard.tsx               # state, API actions และเลือก section
├── admin-types.ts                    # type และค่า form เริ่มต้น
├── sections/
│   ├── AdminSidebar.tsx
│   ├── AdminOverview.tsx
│   ├── AdminVehiclesSection.tsx
│   ├── AdminRoutesSection.tsx
│   └── AdminStopsSection.tsx
└── ui/AdminPanels.tsx                # panel และ form ที่ใช้ร่วมกัน
```

ตัวอย่าง: ถ้าจะแก้หน้าแก้ไขรถ ให้เปิด `components/admin/sections/AdminVehiclesSection.tsx` ถ้าจะแก้การเรียง Stop ใน Route ให้เปิด `AdminRoutesSection.tsx`

## Shared UI

- สี, typography, spacing และ responsive layout: `app/globals.css`
- Header: `components/layout/SiteHeader.tsx`
- แผนที่: `components/map/RouteMap.tsx` และ `components/map/VehicleMap.tsx`
- ตัวเรียก API ฝั่ง client: `lib/client-api.ts`

หลังแก้โค้ดให้ตรวจด้วย:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```
