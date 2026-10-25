"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameOverModal } from "@/components/game-over-modal";
import { TouchControls } from "@/components/touch-controls";
import type { Game } from "@/lib/games";
const SKINS = ["clasico", "neon", "retro"] as const;
const MODES = ["oscuro", "claro"] as const;
type Skin = (typeof SKINS)[number];
type Mode = (typeof MODES)[number];
const SKIN_LABEL: Record<Skin, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};
const MODE_LABEL: Record<Mode, string> = { oscuro: "OSCURO", claro: "CLARO" };
type ParentToGame =
  | { type: "av:pause" }
  | { type: "av:resume" }
  | { type: "av:restart" }
  | { type: "av:end" }
  | { type: "av:skin"; skin: Skin; mode: Mode }
  | { type: "av:key"; code: string; down: boolean };
// Lee la skin guardada para el juego (av_skin_<id>); valores inválidos caen en los de por defecto.
function readSkin(id: string): { skin: Skin; mode: Mode } {
  try {
    const raw = JSON.parse(localStorage.getItem(`av_skin_${id}`) ?? "null");
    return {
      skin: SKINS.includes(raw?.skin) ? raw.skin : "clasico",
      mode: MODES.includes(raw?.mode) ? raw.mode : "oscuro",
    };
  } catch {
    return { skin: "clasico", mode: "oscuro" };
  }
}
// Partida real: el juego vive en un iframe (public/) y habla con la plataforma por postMessage.
export function EmbeddedGamePlayer({ game }: { game: Game & { src: string } }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [look, setLook] = useState<{ skin: Skin; mode: Mode }>({
    skin: "clasico",
    mode: "oscuro",
  });
  const send = (msg: ParentToGame) => {
    frameRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  };
  // Estable entre renders: TouchControls (memo) no se re-renderiza al cambiar SKIN o MODO.
  const sendKey = useCallback((code: string, down: boolean) => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "av:key", code, down } satisfies ParentToGame,
      window.location.origin,
    );
  }, []);
  const sendSkin = (l: { skin: Skin; mode: Mode }) =>
    send({ type: "av:skin", skin: l.skin, mode: l.mode });
  // Devuelve el teclado al juego (tras cargar, reanudar o reiniciar).
  const focusGame = () => frameRef.current?.contentWindow?.focus();
  // La skin guardada se lee tras montar (no en el render) para no romper la hidratación.
  useEffect(() => {
    const saved = readSkin(game.id);
    queueMicrotask(() => setLook(saved));
  }, [game.id]);
  // El iframe puede terminar de cargar antes de la hidratación y React no ve su onLoad;
  // este efecto también envía la skin en cada cambio.
  useEffect(() => {
    const win = frameRef.current?.contentWindow;
    if (
      win?.document.readyState === "complete" &&
      win.location.pathname === game.src
    )
      win.postMessage(
        { type: "av:skin", skin: look.skin, mode: look.mode },
        window.location.origin,
      );
  }, [game.src, look]);
  useEffect(() => {
    const win = frameRef.current?.contentWindow;
    if (
      win?.document.readyState === "complete" &&
      win.location.pathname === game.src
    )
      win.focus();
  }, [game.src]);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (
        e.source !== frameRef.current?.contentWindow ||
        e.origin !== window.location.origin
      )
        return;
      if (e.data?.type === "av:gameover" && typeof e.data.score === "number") {
        setPaused(false);
        setFinalScore(e.data.score);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  const changeLook = (next: { skin: Skin; mode: Mode }) => {
    setLook(next);
    try {
      localStorage.setItem(`av_skin_${game.id}`, JSON.stringify(next));
    } catch {}
    focusGame();
  };
  const cycleSkin = () =>
    changeLook({
      ...look,
      skin: SKINS[(SKINS.indexOf(look.skin) + 1) % SKINS.length],
    });
  const toggleMode = () =>
    changeLook({ ...look, mode: look.mode === "oscuro" ? "claro" : "oscuro" });
  const togglePause = () => {
    send({ type: paused ? "av:resume" : "av:pause" });
    if (paused) focusGame();
    setPaused(!paused);
  };
  const restart = () => {
    send({ type: "av:restart" });
    setPaused(false);
    setFinalScore(null);
    focusGame();
  };
  const over = finalScore !== null;
  return (
    // Ancho limitado para que la pantalla 4:3 entera quepa en la ventana sin scroll:
    // 296px = nav + márgenes + barra + marco CRT; 96px = rellenos laterales del reproductor y del CRT.
    // En táctil horizontal (modo inmersivo, sin nav ni pie del CRT): 108px de alto y 56px de rellenos.
    <div className="av-player fade-in max-w-[min(1100px,max(420px,calc((100dvh-296px)*4/3+96px)))] [@media(pointer:coarse)_and_(orientation:landscape)]:max-w-[calc((100dvh-108px)*4/3+56px)]">
      <div className="player-hud">
        <div className="hud-actions ml-auto">
          {/* z-[90]: por encima del fondo del modal (z 80) para cambiar la skin con el modal abierto. */}
          <button className="btn cyan relative z-[90]" onClick={cycleSkin}>
            SKIN · {SKIN_LABEL[look.skin]}
          </button>
          <button className="btn ghost relative z-[90]" onClick={toggleMode}>
            MODO · {MODE_LABEL[look.mode]}
          </button>
          <button className="btn yellow" onClick={togglePause} disabled={over}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button
            className="btn magenta"
            onClick={() => send({ type: "av:end" })}
            disabled={over}
          >
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>
      <div className="crt">
        <div className="crt-screen">
          <iframe
            ref={frameRef}
            src={game.src}
            title={game.title}
            onLoad={() => {
              sendSkin(look);
              focusGame();
            }}
            className="absolute inset-0 block h-full w-full border-0"
          />
          {/* Se desmonta en pausa y con el modal abierto: al hacerlo suelta las teclas pulsadas. */}
          {game.controls && !paused && !over && (
            <TouchControls
              controls={game.controls}
              color={game.color}
              onKey={sendKey}
            />
          )}
          {paused && (
            <div className="crt-content z-[5] bg-black/60">
              <div>
                <div className="pixel neon-yellow text-[22px]">EN PAUSA</div>
                <div className="mono mt-2.5 text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        {!game.controls && <p className="touch-hint">REQUIERE TECLADO</p>}
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {over && (
        <GameOverModal
          score={finalScore}
          onRestart={restart}
          gameId={game.id}
        />
      )}
    </div>
  );
}
