"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent } from "react";
import type { GameColor, TouchControls as Controls } from "@/lib/games";
// Auto-repetición de las teclas con repeat, como el autorepeat del teclado.
const REPEAT_DELAY = 170;
const REPEAT_EVERY = 50;
const DIR_LABEL = {
  up: "Arriba",
  down: "Abajo",
  left: "Izquierda",
  right: "Derecha",
} as const;
// Posición en la rejilla 3×3 del rombo: 1.º abajo, 2.º derecha, 3.º izquierda, 4.º arriba.
const DIAMOND = ["bottom", "right", "left", "top"] as const;
type Key = { code: string; repeat?: boolean };
// Mando táctil superpuesto al CRT (SPEC 10). Solo se ve con (pointer: coarse); cada toque llega
// al juego como onKey(code, down). Al desmontarse (pausa, fin) suelta todas las teclas pulsadas.
export function TouchControls({
  controls,
  color,
  onKey,
}: {
  controls: Controls;
  color: GameColor;
  onKey: (code: string, down: boolean) => void;
}) {
  // Punteros activos por tecla: varios dedos sobre la misma tecla solo envían un keydown/keyup.
  const held = useRef(new Map<string, Set<number>>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const onKeyRef = useRef(onKey);
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    onKeyRef.current = onKey;
  }, [onKey]);
  useEffect(() => {
    const heldNow = held.current;
    const timersNow = timers.current;
    return () => {
      timersNow.forEach((t) => clearTimeout(t));
      timersNow.clear();
      heldNow.forEach((_, code) => onKeyRef.current(code, false));
      heldNow.clear();
    };
  }, []);
  const sync = () => setPressed(new Set(held.current.keys()));
  const press = (key: Key, e: PointerEvent<HTMLButtonElement>) => {
    // Sin preventDefault el toque mueve el foco y el iframe pierde sus teclas (blur).
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const ids = held.current.get(key.code) ?? new Set<number>();
    const first = ids.size === 0;
    ids.add(e.pointerId);
    held.current.set(key.code, ids);
    if (!first) return;
    onKeyRef.current(key.code, true);
    if (key.repeat) {
      const tick = (ms: number) =>
        timers.current.set(
          key.code,
          setTimeout(() => {
            onKeyRef.current(key.code, true);
            tick(REPEAT_EVERY);
          }, ms),
        );
      tick(REPEAT_DELAY);
    }
    sync();
  };
  const release = (key: Key, e: PointerEvent<HTMLButtonElement>) => {
    const ids = held.current.get(key.code);
    if (!ids?.delete(e.pointerId) || ids.size > 0) return;
    held.current.delete(key.code);
    clearTimeout(timers.current.get(key.code));
    timers.current.delete(key.code);
    onKeyRef.current(key.code, false);
    sync();
  };
  const handlers = (key: Key) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => press(key, e),
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => release(key, e),
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => release(key, e),
    onLostPointerCapture: (e: PointerEvent<HTMLButtonElement>) =>
      release(key, e),
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  });
  return (
    <div
      className="touch-controls"
      style={{ "--tc": `var(--${color})` } as CSSProperties}
    >
      <div className="tc-pad">
        {controls.pad.length > 0 && <span className="tc-hub" aria-hidden />}
        {controls.pad.map((k) => (
          <button
            key={k.dir}
            type="button"
            tabIndex={-1}
            aria-label={DIR_LABEL[k.dir]}
            className={`tc-arm ${k.dir}`}
            data-pressed={pressed.has(k.code) || undefined}
            {...handlers(k)}
          >
            <svg viewBox="0 0 10 10" aria-hidden>
              <path d="M2 6.5 5 3.5 8 6.5" />
            </svg>
          </button>
        ))}
      </div>
      <div className="tc-actions">
        {controls.buttons.map((b, i) => (
          <button
            key={b.code}
            type="button"
            tabIndex={-1}
            className={`tc-btn ${DIAMOND[i]}`}
            data-pressed={pressed.has(b.code) || undefined}
            {...handlers(b)}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
