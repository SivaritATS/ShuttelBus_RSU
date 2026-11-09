"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "th" | "en";

export const dictionary = {
  // Brand & Header
  brandTitle: { th: "Shuttle Bus RSU", en: "Shuttle Bus RSU" },
  brandSubtitle: { th: "ระบบติดตามรถราง ม.รังสิต", en: "RSU Tram Tracking System" },
  navMainMap: { th: "แผนที่หลัก", en: "Main Map" },
  navAdmin: { th: "ระบบจัดการ (Admin)", en: "Admin Console" },
  navLogout: { th: "ออกจากระบบ", en: "Log Out" },
  campusLive: { th: "RSU Campus Live", en: "RSU Campus Live" },
  campusLiveTooltip: {
    th: "ระบบติดตามตำแหน่งรถรางและจุดจอด มหาวิทยาลัยรังสิต",
    en: "Real-time Shuttle Tracking & Stops System, Rangsit University",
  },

  // Hero / Summary
  heroBadge: { th: "RSU CAMPUS REAL-TIME TRANSIT", en: "RSU CAMPUS REAL-TIME TRANSIT" },
  heroTitlePrefix: { th: "แผนที่ติดตามรถราง ", en: "Real-Time Shuttle Map " },
  heroTitleSpan: { th: "ม.รังสิต", en: "Rangsit University" },
  heroDesc: {
    th: "ระบบแสดงตำแหน่งรถรางไฟฟ้าและพิกัดจุดจอด 14 อาคารภายในมหาวิทยาลัยรังสิตแบบสด",
    en: "Live GPS tracking of electric trams and 14 campus stops across Rangsit University",
  },
  statSharingGps: { th: "แชร์พิกัด GPS สด", en: "Sharing Live GPS" },
  statWaitingGps: { th: "รอคนขับเปิด GPS", en: "Waiting for GPS" },
  statStopsLabel: { th: "ป้ายรถรอบ ม.", en: "Campus Stops" },
  refreshBtn: { th: "รีเฟรชตำแหน่ง", en: "Refresh GPS" },
  refreshing: { th: "กำลังอัปเดต…", en: "Updating…" },
  realtimeLive: { th: "Realtime สด", en: "Live Realtime" },
  polling: { th: "Polling", en: "Polling" },

  // Controls Bar
  routesLabel: { th: "สายรถราง:", en: "Routes:" },
  allRoutes: { th: "ทั้งหมด (14 อาคาร)", en: "All (14 Buildings)" },
  layerVehicles: { th: "รถราง", en: "Trams" },
  layerStops: { th: "ป้ายหยุด", en: "Stops" },
  layerRoutes: { th: "เส้นทาง", en: "Route Line" },
  trackVehicleActive: { th: "🎯 กำลังติดตามพิกัดสด", en: "🎯 Tracking Live" },
  trackVehicle: { th: "🎯 ติดตามรถสด", en: "🎯 Track Live" },
  overviewCampus: { th: "ภาพรวม ม.รังสิต", en: "Campus Overview" },

  // Focus Indicator
  focusingVehicle: { th: "🎯 กำลังติดตามพิกัดสดจากมือถือ: ", en: "🎯 Live Tracking from Driver: " },
  focusing: { th: "กำลังโฟกัส: ", en: "Focusing: " },
  cancelFocus: { th: "✕ ยกเลิก", en: "✕ Cancel" },

  // Fleet Panel
  fleetTitlePrefix: { th: "ขบวนรถในระบบ", en: "Active Fleet" },
  fleetSubWait: {
    th: "ยังมีรถในระบบครบถ้วน (รอคนขับเข้าสู่ระบบผ่านแอปมือถือเพื่อเริ่มวิ่ง)",
    en: "All fleet registered (waiting for drivers to log in via mobile app)",
  },
  noVehicles: { th: "ยังไม่มีรถในระบบ", en: "No vehicles in system" },
  noVehiclesSub: {
    th: "เมื่อมีรถและคนขับเริ่มเดินเครื่อง ตำแหน่งจะปรากฏบนแผนที่ทันที",
    en: "Trams will appear on map once drivers start their shifts",
  },
  liveGpsBadge: { th: "● LIVE GPS", en: "● LIVE GPS" },
  standbyBadge: { th: "⚪ สแตนด์บาย", en: "⚪ STANDBY" },
  electricTram: { th: "รถรางไฟฟ้า", en: "Electric Tram" },
  generalRoute: { th: "สายทั่วไป", en: "Regular Line" },
  driverLabel: { th: "👤 คนขับ: ", en: "👤 Driver: " },
  trackLiveBtn: { th: "🎯 ติดตามพิกัด", en: "🎯 Locate" },
  trackingBtn: { th: "🎯 กำลังติดตาม", en: "🎯 Tracking" },
  waitingGpsBtn: { th: "รอเปิด GPS", en: "Waiting GPS" },
  gpsCoordsLive: { th: "GPS สดจากมือถือ: ", en: "Live Phone GPS: " },
  coordsStatus: { th: "สถานะพิกัด: ", en: "GPS Status: " },
  waitingGpsSignal: { th: "รอสัญญาณ GPS จากมือถือคนขับ", en: "Waiting for driver phone signal" },
  sharingLive: { th: "กำลังแชร์สด", en: "Sharing Live" },
  offline: { th: "ออฟไลน์", en: "Offline" },

  // Stops Panel
  stopsTitle: { th: "จุดจอดและอาคารในมหาวิทยาลัย", en: "Campus Stops & Buildings" },
  stopsSub: {
    th: "พิกัด 14 อาคารตามแนวเส้นทางรถราง (คลิกเพื่อเลื่อนดูบนแผนที่)",
    en: "14 campus buildings along tram lines (click to view on map)",
  },
  searchPlaceholder: { th: "ค้นหาชื่อตึก / อาคาร…", en: "Search buildings, stops…" },
  clickToView: { th: "คลิกเพื่อดู ↗", en: "View ↗" },

  // Map Popup
  gpsCoordsLabel: { th: "พิกัด GPS:", en: "GPS Coordinates:" },

  // Footer
  footerUni: { th: "มหาวิทยาลัยรังสิต (Rangsit University)", en: "Rangsit University" },
  footerService: { th: "บริการรถรางรับส่งภายในวิทยาเขต", en: "Campus Electric Tram Shuttle Service" },
  footerStopsNote: { th: "อิงพิกัดทางเข้า-ออก และตึก 2-19 ครบ 14 จุด", en: "Main Entrance/Exit & Buildings 2-19 (14 stops)" },

  // Admin Sidebar & General
  adminOperations: { th: "ระบบจัดการ (Admin)", en: "Operations" },
  adminControlRoom: { th: "ศูนย์ควบคุมระบบขนส่ง ม.รังสิต", en: "Campus transport control room" },
  adminTabOverview: { th: "ภาพรวมระบบ", en: "Overview" },
  adminTabLiveMap: { th: "แผนที่สด & ทริปเดินรถ", en: "Live Map & Trips" },
  adminTabVehicles: { th: "จัดการรถราง (Vehicle)", en: "Vehicles" },
  adminTabRoutes: { th: "จัดการสายรถ (Route)", en: "Routes" },
  adminTabStops: { th: "จัดการจุดจอด (Stop)", en: "Stops" },

  // Admin Overview
  adminActiveRoutes: { th: "สายรถที่เปิดใช้งาน", en: "Active routes" },
  adminActiveVehicles: { th: "รถที่พร้อมวิ่ง", en: "Active vehicles" },
  adminMappedStops: { th: "จุดจอดที่บันทึกไว้", en: "Mapped stops" },
  adminRouteCoverage: { th: "เส้นทางเดินรถทั้งหมด", en: "Route coverage" },
  adminRouteCoverageSub: { th: "เส้นทางที่พร้อมให้ระบบแสดงบนหน้าเว็บหลัก", en: "Routes ready for public web tracking" },
  adminManageRoutes: { th: "จัดการเส้นทาง →", en: "Manage routes →" },

  // Admin Live Map
  adminLiveOperationsCenter: { th: "ศูนย์ติดตามสถานะเดินรถแบบเรียลไทม์", en: "Realtime Operations Center" },
  adminLiveTitle: { th: "แผนที่และสถานะเดินรถ (Live Fleet & Trips)", en: "Live Fleet & Trips" },
  adminLiveDesc: { th: "ตรวจสอบตำแหน่งรถรางและทริปที่กำลังปฏิบัติการแบบ Realtime ผ่าน Socket.IO", en: "Track tram locations and active trips in real time via Socket.IO" },
  adminSocketConnected: { th: "เชื่อมต่อ Socket แล้ว", en: "Socket Connected" },
  adminSocketReconnecting: { th: "กำลังเชื่อมต่อใหม่…", en: "Reconnecting…" },
  adminResetView: { th: "รีเซ็ตมุมมอง", en: "Reset View" },
  adminActiveTripsHeading: { th: "ทริปที่กำลังดำเนินการ", en: "Active Trips" },
  adminActiveTripsSub: { th: "สถานะการเดินรถที่กำลังบันทึกพิกัด", en: "Live trip status being tracked" },
  adminNoActiveTrips: { th: "ขณะนี้ไม่มีทริปที่กำลังเดินรถ", en: "No active trips right now" },
  adminNoActiveTripsSub: { th: "สามารถเลือกเริ่มทริปใหม่ได้จากแผงควบคุมรถด้านขวา", en: "You can start a new trip from the vehicle panel" },
  adminEndTrip: { th: "จบทริป (End Trip)", en: "End Trip" },
  adminStartTrip: { th: "เริ่มทริป (Start)", en: "Start Trip" },
  adminSimulateGps: { th: "จำลอง GPS", en: "Simulate GPS" },
  adminVehicleFleetHeading: { th: "ควบคุมยานพาหนะ", en: "Vehicle Fleet Control" },
  adminVehicleFleetSub: { th: "เริ่มทริปใหม่ หรือจำลองส่งพิกัด GPS แบบ Realtime", en: "Start new trips or simulate GPS in real time" },

  // Admin Common UI
  adminBtnEdit: { th: "แก้ไข", en: "Edit" },
  adminBtnDelete: { th: "ลบ", en: "Delete" },
  adminBtnSave: { th: "บันทึก", en: "Save" },
  adminBtnClear: { th: "ล้าง", en: "Clear" },
  adminVehiclesTitle: { th: "ยานพาหนะ (Vehicles)", en: "Vehicles" },
  adminVehiclesSub: { th: "ยานพาหนะทั้งหมดในระบบ", en: "All fleet registered in system" },
  adminRoutesTitle: { th: "เส้นทางเดินรถ (Routes)", en: "Routes" },
  adminRoutesSub: { th: "เส้นทางและการเรียงลำดับจุดจอด", en: "Routes and ordered stop sequence" },
  adminStopsTitle: { th: "จุดจอด (Stops)", en: "Stops" },
  adminStopsSub: { th: "จุดจอดพร้อมพิกัดสำหรับแผนที่", en: "Campus stops with coordinates" },
  adminThVehicle: { th: "ยานพาหนะ", en: "Vehicle" },
  adminThRoute: { th: "สายรถ", en: "Route" },
  adminThLocation: { th: "พิกัด (GPS)", en: "Location (GPS)" },
  adminThStatus: { th: "สถานะการติดตาม", en: "Tracking Status" },
  adminThActive: { th: "สถานะ", en: "Status" },
  adminThStops: { th: "จำนวนจุดจอด", en: "Stops" },
  adminThCoordinates: { th: "พิกัด", en: "Coordinates" },
  adminStatusLiveDriver: { th: "Live (GPS มือถือ)", en: "Live (Driver GPS)" },
  adminStatusStandby: { th: "Standby (รอคนขับ)", en: "Standby (Waiting driver)" },
  adminStatusActive: { th: "เปิดใช้งาน", en: "Active" },
  adminStatusInactive: { th: "ปิดใช้งาน", en: "Inactive" },
  adminStatusPublic: { th: "แสดงบนเว็บ", en: "Public" },
  adminStatusDraft: { th: "แบบร่าง", en: "Draft" },
  adminStatusHidden: { th: "ซ่อน", en: "Hidden" },
  adminAddStop: { th: "+ เพิ่มจุดจอด", en: "+ Add stop" },
  adminSelectStopPlaceholder: { th: "เลือกจุดจอดเพื่อเพิ่ม…", en: "Select stop to add…" },
  adminNoStopsInRoute: { th: "ยังไม่มีจุดจอดในสายนี้", en: "No stops assigned to this route" },
  adminStopsInRoute: { th: "จุดจอดในสาย", en: "Stops in" },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: keyof typeof dictionary) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "th",
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => dictionary[key]?.th || String(key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("th");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rsu_lang") as Language | null;
      if (stored === "th" || stored === "en") {
        setLangState(stored);
        document.documentElement.setAttribute("lang", stored);
      }
    } catch {}

    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: Language }>;
      if (customEvent.detail?.lang) {
        setLangState(customEvent.detail.lang);
      }
    };

    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    try {
      localStorage.setItem("rsu_lang", nextLang);
      document.documentElement.setAttribute("lang", nextLang);
      window.dispatchEvent(new CustomEvent("languagechange", { detail: { lang: nextLang } }));
    } catch {}
  };

  const toggleLang = () => {
    setLang(lang === "th" ? "en" : "th");
  };

  const t = (key: keyof typeof dictionary): string => {
    return dictionary[key]?.[lang] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

