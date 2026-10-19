"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { formatScore } from "@/lib/games";
import { saveScore, type SaveScoreState } from "@/lib/save-score";
const IDLE: SaveScoreState = { status: "idle" };
// Mayúsculas, solo A-Z, 0-9, _ y espacio, máximo 10 caracteres.
const cleanName = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9_ ]/g, "")
    .slice(0, 10);
// Modal "FIN DEL JUEGO" compartido por el reproductor simulado y el embebido.
// Con gameId guarda en Supabase; sin él, el guardado es solo visual.
export function GameOverModal({
  score,
  onRestart,
  gameId,
}: {
  score: number;
  onRestart: () => void;
  gameId?: string;
}) {
  const [name, setName] = useState("INVITADO");
  const [savedLocally, setSavedLocally] = useState(false);
  const [state, save, pending] = useActionState(
    async (): Promise<SaveScoreState> =>
      gameId ? saveScore(gameId, name, score) : IDLE,
    IDLE,
  );
  const saved = state.status === "success" || savedLocally;
  const submit = () => {
    if (pending) return;
    if (!gameId) {
      setSavedLocally(true);
      return;
    }
    save();
  };
  return (
    <div className="modal-bd">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        <h2 id="game-over-title">FIN DEL JUEGO</h2>
        <div className="final-label">PUNTUACIÓN FINAL</div>
        <div className="final">{formatScore(score)}</div>
        {!saved ? (
          <>
            <form className="input-row" action={submit} aria-busy={pending}>
              <input
                value={name}
                readOnly={pending}
                onChange={(e) => setName(cleanName(e.target.value))}
                placeholder="TUS INICIALES"
                aria-label="Tus iniciales"
              />
              <button
                className={
                  "btn " + (state.status === "error" ? "magenta" : "yellow")
                }
                type="submit"
                disabled={pending}
              >
                {pending
                  ? "GUARDANDO…"
                  : state.status === "error"
                    ? "REINTENTAR"
                    : "GUARDAR PUNTUACIÓN"}
              </button>
            </form>
            {state.status === "error" && !pending && (
              <p
                className="font-pixel text-[10px] leading-relaxed text-magenta"
                role="alert"
              >
                ▸ NO SE PUDO GUARDAR. REVISA TU NOMBRE O TU CONEXIÓN.
              </p>
            )}
          </>
        ) : (
          <div role="status">
            <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            {state.status === "success" && state.rank !== undefined && (
              <div className="font-pixel mt-3 text-[14px] text-yellow">
                PUESTO #{state.rank}
              </div>
            )}
          </div>
        )}
        <div className="actions">
          <button className="btn" onClick={onRestart}>
            JUGAR DE NUEVO
          </button>
          {state.status === "success" && (
            <Link href="/salon" className="btn yellow">
              VER SALÓN
            </Link>
          )}
          <Link href="/games" className="btn magenta">
            VOLVER AL VAULT
          </Link>
        </div>
      </div>
    </div>
  );
}
