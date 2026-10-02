import type { Metadata } from "next";
import "./globals.css";

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
                  var stored = localStorage.getItem('rsu_theme');
                  var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
