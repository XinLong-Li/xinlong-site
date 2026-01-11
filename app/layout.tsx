import "./globals.css";
import Providers from "./providers";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import type { ReactNode } from "react";

export const metadata = {
  title: "Xinlong Li",
  description: "Personal site - Embedded Software Engineer / Robotics Motion Control",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <Providers>
          <Navigation />
          <div className="bg-glow" />
          <main className="container">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
