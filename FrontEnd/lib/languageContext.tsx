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

