import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LotNeeti",
  description: "IPO planning for your family or group",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
