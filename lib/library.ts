import { connection } from "next/server";
import { GAMES, type Game } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";
// Juegos de la biblioteca (solo servidor): los de lib/games.ts cuyo id está en
// la tabla games de Supabase, en el orden del catálogo, con su mejor puntuación real.
export type LibraryGame = Game & { best: number };
export type LibraryGames =
  { status: "ok"; games: LibraryGame[] } | { status: "error" };
export async function getLibraryGames(): Promise<LibraryGames> {
  // Fuera del try: durante el prerender cookies() rechaza a propósito y el
  // catch lo confundiría con un fallo de Supabase.
  await connection();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("games").select("id");
    if (error) throw error;
    const ids = new Set(data.map(({ id }) => id));
    const games = await Promise.all(
      GAMES.filter((g) => ids.has(g.id)).map(async (g) => {
        const { data, error } = await supabase
          .from("leaderboard")
          .select("score")
          .eq("game_id", g.id)
          .order("score", { ascending: false })
          .limit(1);
        if (error) throw error;
        return { ...g, best: data[0]?.score ?? 0 };
      }),
    );
    return { status: "ok", games };
  } catch (error) {
    console.error("getLibraryGames: no se pudo leer la tabla games", error);
    return { status: "error" };
  }
}
