"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/ipos", label: "IPOs" },
  { href: "/plan", label: "Plan" },
  { href: "/funds", label: "Funds" },
  { href: "/applications", label: "Applications" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/settings/investors", label: "Settings" },
];

export default function AppNav() {
  const pathname = usePathname();
  return <header className="app-header">
    <div className="app-header-inner">
      <Link className="app-brand" href="/">LotNeeti</Link>
      <nav className="app-nav" aria-label="Primary">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>;
        })}
      </nav>
    </div>
  </header>;
}
