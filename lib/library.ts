import { connection } from "next/server";
import { GAMES, type Game } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";
// Juegos de la biblioteca (solo servidor): los de lib/games.ts cuyo id está en
// la tabla games de Supabase, en el orden del catálogo.
export type LibraryGames =
  { status: "ok"; games: Game[] } | { status: "error" };
export async function getLibraryGames(): Promise<LibraryGames> {
  // Fuera del try: durante el prerender cookies() rechaza a propósito y el
  // catch lo confundiría con un fallo de Supabase.
  await connection();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("games").select("id");
    if (error) throw error;
    const ids = new Set(data.map(({ id }) => id));
    return { status: "ok", games: GAMES.filter((g) => ids.has(g.id)) };
  } catch (error) {
    console.error("getLibraryGames: no se pudo leer la tabla games", error);
    return { status: "error" };
  }
}
