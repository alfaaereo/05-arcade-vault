"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameOverModal } from "@/components/game-over-modal";
import type { Game } from "@/lib/games";
type ParentToGame = "av:pause" | "av:resume" | "av:restart" | "av:end";
// Partida real: el juego vive en un iframe (public/) y habla con la plataforma por postMessage.
export function EmbeddedGamePlayer({ game }: { game: Game & { src: string } }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const send = (type: ParentToGame) => {
    frameRef.current?.contentWindow?.postMessage(
      { type },
      window.location.origin,
    );
  };
  // Devuelve el teclado al juego (tras cargar, reanudar o reiniciar).
  const focusGame = () => frameRef.current?.contentWindow?.focus();
  // El iframe puede terminar de cargar antes de la hidratación y React no ve su onLoad.
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
  const togglePause = () => {
    send(paused ? "av:resume" : "av:pause");
    if (paused) focusGame();
    setPaused(!paused);
  };
  const restart = () => {
    send("av:restart");
    setPaused(false);
    setFinalScore(null);
    focusGame();
  };
  const over = finalScore !== null;
  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="hud-actions ml-auto">
          <button className="btn yellow" onClick={togglePause} disabled={over}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button
            className="btn magenta"
            onClick={() => send("av:end")}
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
            onLoad={focusGame}
            className="absolute inset-0 block h-full w-full border-0"
          />
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
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {over && <GameOverModal score={finalScore} onRestart={restart} />}
    </div>
  );
}
