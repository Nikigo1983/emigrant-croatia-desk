import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { PwaAppleSplashLinks } from "@/components/pwa/pwa-apple-splash-links";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import {
  PWA_BACKGROUND_COLOR,
  PWA_MANIFEST_PATH,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa/constants";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: PWA_THEME_COLOR,
};

export const metadata: Metadata = {
  title: "Emigrant Croatia Desk",
  description: "Личный кабинет для цифровых кочевников в Хорватии",
  applicationName: PWA_SHORT_NAME,
  manifest: PWA_MANIFEST_PATH,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_SHORT_NAME,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": PWA_SHORT_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${montserrat.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content={PWA_THEME_COLOR} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={PWA_SHORT_NAME} />
        <meta name="background-color" content={PWA_BACKGROUND_COLOR} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <PwaAppleSplashLinks />
      </head>
      <body className="app-shell min-h-full flex flex-col">
        {children}
        <PwaProvider />
      </body>
    </html>
  );
}
