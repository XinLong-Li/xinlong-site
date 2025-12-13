import "./globals.css";
import Providers from "./providers";
import Navigation from "@/components/Navigation";
import type { ReactNode } from "react";

export const metadata = {
  title: "Xinlong Li",
  description: "Personal site"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <Providers>
          <Navigation />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
