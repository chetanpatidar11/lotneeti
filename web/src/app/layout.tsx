import type { Metadata } from "next";
import { cookies } from "next/headers";
import AppNav from "./app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "LotNeeti",
  description: "IPO planning for your family or group",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const signedIn = (await cookies()).has("sessionid");
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        {signedIn && <AppNav />}
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
