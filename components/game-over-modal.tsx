"use client";
import Link from "next/link";
import { useState } from "react";
import { formatScore } from "@/lib/games";
// Modal "FIN DEL JUEGO" compartido por el reproductor simulado y el embebido.
export function GameOverModal({
  score,
  onRestart,
}: {
  score: number;
  onRestart: () => void;
}) {
  const [name, setName] = useState("INVITADO");
  const [saved, setSaved] = useState(false);
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
          <div className="input-row">
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value.toUpperCase().slice(0, 10))
              }
              placeholder="TUS INICIALES"
              aria-label="Tus iniciales"
            />
            {/* Sin persistencia en este MVP: solo muestra la confirmación. */}
            <button className="btn yellow" onClick={() => setSaved(true)}>
              GUARDAR PUNTUACIÓN
            </button>
          </div>
        ) : (
          <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        )}
        <div className="actions">
          <button className="btn" onClick={onRestart}>
            JUGAR DE NUEVO
          </button>
          <Link href="/games" className="btn magenta">
            VOLVER AL VAULT
          </Link>
        </div>
      </div>
    </div>
  );
}
