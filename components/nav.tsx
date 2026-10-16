import Link from "next/link";
import { Suspense } from "react";
import { NavLinks, NavLinksFallback } from "@/components/nav-links";

export function Nav() {
  return (
    <nav className="av-nav">
      <Link href="/" className="logo">
        <div className="logo-mark"></div>
        <div className="logo-text neon-cyan">
          ARCADE <span className="neon-magenta">VAULT</span>
        </div>
      </Link>
      {/* usePathname se suspende en rutas con params no pre-generados (cacheComponents) */}
      <Suspense fallback={<NavLinksFallback />}>
        <NavLinks />
      </Suspense>
      <div className="spacer"></div>
      <Link href="/login" className="btn auth-btn">
        Iniciar Sesión
      </Link>
    </nav>
  );
}
