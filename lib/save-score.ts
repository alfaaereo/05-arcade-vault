import { createClient } from "@/lib/supabase/client";
// Guardado de puntuaciones desde el navegador con la publishable key.
// Los mismos límites están en la base de datos (check + política de INSERT).
export const PLAYER_NAME_RE = /^[A-Z0-9_ ]{1,10}$/;
export const MAX_SCORE = 10_000_000;
export type SaveScoreState =
  | { status: "idle" }
  | { status: "success"; rank?: number } // sin rank si falló el conteo del puesto
  | { status: "error" };
export async function saveScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<SaveScoreState> {
  const name = playerName.trim();
  if (
    !PLAYER_NAME_RE.test(name) ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > MAX_SCORE
  ) {
    return { status: "error" };
  }
  try {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("leaderboard")
      .insert({ game_id: gameId, player_name: name, score })
      .select("score, created_at")
      .single();
    if (error) throw error;
    // Puesto: filas con más puntos, o con los mismos y guardadas antes.
    const { count, error: countError } = await supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId)
      .or(
        `score.gt.${row.score},and(score.eq.${row.score},created_at.lt."${row.created_at}")`,
      );
    if (countError || count === null) {
      console.error("saveScore: no se pudo calcular el puesto", countError);
      return { status: "success" };
    }
    return { status: "success", rank: count + 1 };
  } catch (error) {
    console.error("saveScore: no se pudo guardar la puntuación", error);
    return { status: "error" };
  }
}
