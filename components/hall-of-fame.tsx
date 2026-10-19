"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formatScore, GAMES, seededScores, type ScoreRow } from "@/lib/games";
import type { Leaderboards } from "@/lib/leaderboard";
const TOP_CLASS = ["top1", "top2", "top3"];
// Terminal VAULT-OS para los estados de carga, vacío y error del Salón.
export function HallTerminal({
  error,
  children,
}: {
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={"terminal-success" + (error ? " is-error" : "")}
      role="status"
      aria-live="polite"
    >
      <div className="term-bar">
        <span className="dot r"></span>
        <span className="dot y"></span>
        <span className="dot g"></span>
        <span className="term-title">VAULT-OS // SALÓN</span>
      </div>
      <div className="term-body">
        <div className="line">
          <span className="prompt">vault@arcade:~$</span> ./leaderboard --top=12
        </div>
        {children}
      </div>
    </div>
  );
}
function PodiumSlot({
  row,
  place,
}: {
  row?: ScoreRow;
  place: "silver" | "bronze";
}) {
  return (
    <div className={`podium-slot ${place}`}>
      <div className="rank-num">{place === "silver" ? "02" : "03"}</div>
      <div className="name">{row?.name ?? "---"}</div>
      <div className="score">{row ? formatScore(row.score) : "---"}</div>
      <div className="date">{row?.date ?? "---"}</div>
    </div>
  );
}
function Board({ gameId, rows }: { gameId: string; rows: ScoreRow[] }) {
  return (
    <>
      <div className="podium">
        <PodiumSlot row={rows[1]} place="silver" />
        <div className="podium-slot gold">
          <div className="pixel text-[9px] tracking-[0.18em] text-gold">
            CAMPEÓN
          </div>
          <div className="rank-num mt-1 text-[36px]">01</div>
          <div className="name">{rows[0].name}</div>
          <div className="score text-[20px]">{formatScore(rows[0].score)}</div>
          <div className="date">{rows[0].date}</div>
        </div>
        <PodiumSlot row={rows[2]} place="bronze" />
      </div>
      {/* key fuerza a remontar las filas para repetir la animación al cambiar de juego */}
      <div className="hall-table" key={gameId}>
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name + i}
            className={`tr ${TOP_CLASS[i] ?? ""}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{formatScore(r.score)}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}
// Los juegos presentes en la tabla games usan el leaderboard real; el resto, seededScores.
export function HallOfFame({ leaderboards }: { leaderboards: Leaderboards }) {
  const [gameId, setGameId] = useState(GAMES[0].id);
  const real =
    leaderboards.status === "ok" ? leaderboards.games[gameId] : undefined;
  const rows = real ?? seededScores(gameId.length * 23 + 7, 12);
  return (
    <>
      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={"chip" + (gameId === g.id ? " active" : "")}
            onClick={() => setGameId(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>
      {leaderboards.status === "error" ? (
        <HallTerminal error>
          <div className="line err">
            [ERR] Sin conexión con el registro de puntuaciones.
          </div>
          <div className="line failure">
            &gt; NO SE PUDO CARGAR EL SALÓN. RECARGA LA PÁGINA PARA REINTENTAR.
            <span className="caret">_</span>
          </div>
        </HallTerminal>
      ) : rows.length === 0 ? (
        <HallTerminal key={gameId}>
          <div className="line dim">[OK] Registro abierto. 0 puntuaciones.</div>
          <div className="line success">
            &gt; SIN PUNTUACIONES TODAVÍA. EL PRIMER PUESTO ESTÁ LIBRE.
            <span className="caret">_</span>
          </div>
          <div className="mt-[18px]">
            <Link href={`/juegos/${gameId}/jugar`} className="btn yellow">
              JUGAR AHORA
            </Link>
          </div>
        </HallTerminal>
      ) : (
        <Board gameId={gameId} rows={rows} />
      )}
    </>
  );
}
