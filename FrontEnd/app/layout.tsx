import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shuttle Bus RSU | University Shuttle",
  description: "University shuttle route and stop tracking foundation",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
