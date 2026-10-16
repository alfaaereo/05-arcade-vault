"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LINKS } from "@/components/nav-links";

const PANEL_LINKS = [
  ...LINKS,
  {
    href: "/login",
    label: "Iniciar Sesión",
    isActive: (p: string) => p === "/login",
  },
];

function PanelLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate: () => void;
}) {
  return PANEL_LINKS.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      className={pathname && link.isActive(pathname) ? "active" : ""}
      onClick={onNavigate}
    >
      {link.label}
    </Link>
  ));
}

function ActivePanelLinks({ onNavigate }: { onNavigate: () => void }) {
  return <PanelLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  // El portal solo existe en el cliente; en el servidor no hay document.body.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
      <button
        className="btn ghost hamburger"
        onClick={() => setOpen(true)}
        aria-label="Menú"
      >
        ≡
      </button>
      {/* Portal a body: el backdrop-filter de .av-nav atraparía el position: fixed del panel */}
      {mounted &&
        createPortal(
          <>
            <div
              className={"av-mobile-backdrop" + (open ? " open" : "")}
              onClick={close}
            ></div>
            <aside
              className={"av-mobile-panel" + (open ? " open" : "")}
              aria-hidden={!open}
              inert={!open}
            >
              <div className="pixel neon-cyan mb-4 text-[11px]">MENÚ</div>
              {/* usePathname se suspende en rutas con params no pre-generados (cacheComponents) */}
              <Suspense
                fallback={<PanelLinks pathname={null} onNavigate={close} />}
              >
                <ActivePanelLinks onNavigate={close} />
              </Suspense>
              <div className="flex-1"></div>
              <div className="pixel text-[9px] tracking-[0.16em] text-ink-faint">
                CRÉDITOS · 03
              </div>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}
