"use client";

import { useState } from "react";
import { formatScore, GAMES, seededScores, type ScoreRow } from "@/lib/games";

const TOP_CLASS = ["top1", "top2", "top3"];

function PodiumSlot({ row, place }: { row: ScoreRow; place: "silver" | "bronze" }) {
  return (
    <div className={`podium-slot ${place}`}>
      <div className="rank-num">{String(row.rank).padStart(2, "0")}</div>
      <div className="name">{row.name}</div>
      <div className="score">{formatScore(row.score)}</div>
      <div className="date">{row.date}</div>
    </div>
  );
}

export function HallOfFame() {
  const [gameId, setGameId] = useState(GAMES[0].id);
  const rows = seededScores(gameId.length * 23 + 7, 12);

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

      <div className="podium">
        <PodiumSlot row={rows[1]} place="silver" />
        <div className="podium-slot gold">
          <div className="pixel text-[9px] tracking-[0.18em] text-gold">CAMPEÓN</div>
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
