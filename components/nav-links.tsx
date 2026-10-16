"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Biblioteca", isActive: (p: string) => p === "/" || p.startsWith("/juegos/") },
  { href: "/salon", label: "Salón de la Fama", isActive: (p: string) => p === "/salon" },
];

function Links({ pathname }: { pathname: string | null }) {
  return (
    <div className="links">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname && link.isActive(pathname) ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function NavLinks() {
  return <Links pathname={usePathname()} />;
}

// Fallback sin estado activo mientras se resuelve el pathname.
export function NavLinksFallback() {
  return <Links pathname={null} />;
}
