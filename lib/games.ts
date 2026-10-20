// Catálogo de juegos reales (cada uno con `src` y fila en la tabla games de Supabase).
// Los textos, portadas y colores viven aquí; Supabase decide cuáles se muestran en /games.
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | GameCategory;
export type GameColor = "cyan" | "magenta" | "yellow" | "green";
export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: GameColor;
  best: number;
  plays: string;
  // URL del juego embebible en public/. Sin src, el reproductor simula la partida.
  src?: string;
};
export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};
export const GAMES: Game[] = [
  {
    id: "asteroids",
    title: "ASTEROIDS",
    short: "Rota, propulsa y dispara en un campo de rocas.",
    long: "Tu nave vectorial flota en un espacio sin bordes: lo que sale por un lado entra por el otro. Dispara para partir las rocas grandes en medianas y las medianas en pequeñas. Recoge el power-up 3x para disparar en abanico durante 5 segundos. Tienes tres vidas.",
    cat: "SHOOTER",
    cover: "cover-rocas",
    color: "cyan",
    best: 0,
    plays: "0",
    src: "/games/asteroids/index.html",
  },
  {
    id: "tetris",
    title: "TETRIS",
    short: "El clásico de piezas que caen: completa líneas y sube de nivel.",
    long: "Siete piezas clásicas y una tuerca rebelde caen sobre un tablero de 10×20. Muévelas, rótalas y completa filas para borrarlas: una, dos, tres o cuatro de golpe valen 100, 300, 500 u 800 puntos por nivel. Cada 10 líneas subes de nivel y la caída se acelera. La pieza fantasma te muestra dónde aterrizará.",
    cat: "PUZZLE",
    cover: "cover-tetro",
    color: "magenta",
    best: 0,
    plays: "0",
    src: "/games/tetris/index.html",
  },
  {
    id: "arkanoid",
    title: "ARKANOID",
    short: "Rompe el muro ladrillo a ladrillo en cinco niveles.",
    long: "Mueve la paleta con el ratón o las flechas y mantén la pelota en juego. Cada bloque vale 10 puntos y, al limpiar la pantalla, pasas al siguiente de cinco niveles, cada uno con su propia forma y una pelota más rápida. Tienes tres vidas: supera el quinto nivel para completar el juego.",
    cat: "ARCADE",
    cover: "cover-bricks",
    color: "cyan",
    best: 0,
    plays: "0",
    src: "/games/arkanoid/index.html",
  },
];
export const CATEGORIES: CategoryFilter[] = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
];
export const PLAYERS = [
  "PX_KAI",
  "NEONFOX",
  "Z3R0COOL",
  "M00NRYU",
  "VAULT_07",
  "GLITCHA",
  "ATARI_KID",
  "CYBER_LU",
  "MAGENTA88",
  "SCANLINE",
  "BIT_LORD",
  "ARKADYA",
  "DROID_X",
  "RGB_QUEEN",
  "PIXEL_DAD",
  "RETROVIRA",
  "VECTORX",
  "JOY_STK",
];
export function getGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
// Generador determinista: la misma semilla produce las mismas filas en servidor y cliente.
export function seededScores(seed: number, count = 12): ScoreRow[] {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const used = new Set<string>();
  const rows: ScoreRow[] = [];
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = PLAYERS[Math.floor(rand() * PLAYERS.length)];
    } while (used.has(name) && used.size < PLAYERS.length);
    used.add(name);
    const base = Math.floor(50000 + rand() * 250000);
    const score = base - i * Math.floor(2000 + rand() * 4000);
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
    const mon = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
    rows.push({
      rank: i + 1,
      name,
      score: Math.max(score, 1000),
      date: `${day}/${mon}/2026`,
    });
  }
  return rows
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
const scoreFormat = new Intl.NumberFormat("es-ES");
export function formatScore(n: number): string {
  return scoreFormat.format(n);
}
