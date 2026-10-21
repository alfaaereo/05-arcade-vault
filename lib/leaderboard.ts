import { connection } from "next/server";
import { cache } from "react";
import type { ScoreRow } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";
// Lectura del leaderboard real (solo servidor). Los juegos que no están en la
// tabla games siguen con seededScores en el Salón.
export type Leaderboards =
  { status: "ok"; games: Record<string, ScoreRow[]> } | { status: "error" };
const TOP = 12;
// Fecha fija en UTC para que servidor y cliente pinten el mismo texto.
const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
export async function getLeaderboards(): Promise<Leaderboards> {
  // Fuera del try: durante el prerender cookies() rechaza a propósito y el
  // catch lo confundiría con un fallo de Supabase.
  await connection();
  try {
    const supabase = await createClient();
    const { data: games, error } = await supabase.from("games").select("id");
    if (error) throw error;
    const entries = await Promise.all(
      games.map(async ({ id }) => {
        const { data, error } = await supabase
          .from("leaderboard")
          .select("player_name, score, created_at")
          .eq("game_id", id)
          .order("score", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(TOP);
        if (error) throw error;
        const rows: ScoreRow[] = data.map((r, i) => ({
          rank: i + 1,
          name: r.player_name,
          score: r.score,
          date: dateFormat.format(new Date(r.created_at)),
        }));
        return [id, rows] as const;
      }),
    );
    return { status: "ok", games: Object.fromEntries(entries) };
  } catch (error) {
    console.error("getLeaderboards: no se pudo leer el leaderboard", error);
    return { status: "error" };
  }
}
// Puntuaciones de un solo juego para su página de detalle: top 10 y total de
// puntuaciones guardadas. cache() deduplica la lectura entre las dos zonas
// <Suspense> del detalle dentro de la misma petición.
export type GameScores =
  | { status: "ok"; rows: ScoreRow[]; best: number; total: number }
  | { status: "error" };
const DETAIL_TOP = 10;
export const getGameScores = cache(async (id: string): Promise<GameScores> => {
  await connection();
  try {
    const supabase = await createClient();
    const [top, count] = await Promise.all([
      supabase
        .from("leaderboard")
        .select("player_name, score, created_at")
        .eq("game_id", id)
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(DETAIL_TOP),
      supabase
        .from("leaderboard")
        .select("id", { count: "exact", head: true })
        .eq("game_id", id),
    ]);
    if (top.error) throw top.error;
    if (count.error) throw count.error;
    const rows: ScoreRow[] = top.data.map((r, i) => ({
      rank: i + 1,
      name: r.player_name,
      score: r.score,
      date: dateFormat.format(new Date(r.created_at)),
    }));
    return {
      status: "ok",
      rows,
      best: rows[0]?.score ?? 0,
      total: count.count ?? 0,
    };
  } catch (error) {
    console.error("getGameScores: no se pudo leer el leaderboard", error);
    return { status: "error" };
  }
});
