import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/languageContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1329" },
  ],
};

export const metadata: Metadata = {
  title: "Shuttle Bus RSU | University Shuttle",
  description: "University shuttle route and stop tracking foundation",
  icons: {
    icon: [
      { url: "/Bus_icon.png" },
      { url: "/Bus_icon.png", type: "image/png" },
    ],
    shortcut: "/Bus_icon.png",
    apple: "/Bus_icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Bus_icon.png" type="image/png" />
        <link rel="shortcut icon" href="/Bus_icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Bus_icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('rsu_theme');
                  var theme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                  var storedLang = localStorage.getItem('rsu_lang');
                  if (storedLang) document.documentElement.setAttribute('lang', storedLang);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
