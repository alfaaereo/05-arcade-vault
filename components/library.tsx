"use client";
import { useState } from "react";
import { GameCard } from "@/components/game-card";
import { CATEGORIES, type CategoryFilter } from "@/lib/games";
import type { LibraryGame } from "@/lib/library";
// Recibe los juegos ya filtrados por la tabla games de Supabase (app/games/page.tsx).
export function Library({ games }: { games: LibraryGame[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("TODOS");
  const filtered = games.filter(
    (g) =>
      (category === "TODOS" || g.cat === category) &&
      g.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar un juego por nombre…"
            aria-label="Buscar un juego por nombre"
          />
        </div>
        <div className="av-chips">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={"chip" + (category === c ? " active" : "")}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="av-grid">
        {filtered.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-20 text-center text-ink-faint">
            <div className="pixel mb-3 text-[14px] text-magenta">
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </>
  );
}
