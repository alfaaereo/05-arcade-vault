"use client";

import { useEffect } from "react";

// Añade .in a cada .reveal cuando entra en pantalla. Marca <html> con
// .reveal-ready para activar el estado oculto: sin JS el contenido queda visible.
// Se monta dentro de cada página para reiniciarse al cambiar de ruta.
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in)");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    document.documentElement.classList.add("reveal-ready");
    return () => io.disconnect();
  }, []);

  return null;
}
