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
  // URL del juego embebible en public/. Sin src, el reproductor simula la partida.
  src?: string;
  // Mando táctil que la plataforma superpone al CRT (SPEC 10). Sin controls, en táctil se avisa "REQUIERE TECLADO".
  controls?: TouchControls;
};
export type TouchButton = {
  code: string; // KeyboardEvent.code que se envía, p. ej. "Space"
  label: string; // texto del botón, p. ej. "DISPARO"
  repeat?: boolean; // auto-repetición mientras se mantiene
};
export type TouchControls = {
  pad: {
    code: string;
    dir: "up" | "down" | "left" | "right";
    repeat?: boolean;
  }[];
  // 0–4, en rombo: el 1.º abajo, el 2.º a la derecha, el 3.º a la izquierda, el 4.º arriba.
  buttons: TouchButton[];
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
    src: "/games/asteroids/index.html",
    controls: {
      pad: [
        { code: "ArrowLeft", dir: "left" },
        { code: "ArrowUp", dir: "up" },
        { code: "ArrowRight", dir: "right" },
      ],
      buttons: [{ code: "Space", label: "DISPARO" }],
    },
  },
  {
    id: "tetris",
    title: "TETRIS",
    short: "El clásico de piezas que caen: completa líneas y sube de nivel.",
    long: "Siete piezas clásicas y una tuerca rebelde caen sobre un tablero de 10×20. Muévelas, rótalas y completa filas para borrarlas: una, dos, tres o cuatro de golpe valen 100, 300, 500 u 800 puntos por nivel. Cada 10 líneas subes de nivel y la caída se acelera. La pieza fantasma te muestra dónde aterrizará.",
    cat: "PUZZLE",
    cover: "cover-tetro",
    color: "magenta",
    src: "/games/tetris/index.html",
    controls: {
      pad: [
        { code: "ArrowLeft", dir: "left", repeat: true },
        { code: "ArrowDown", dir: "down", repeat: true },
        { code: "ArrowRight", dir: "right", repeat: true },
      ],
      buttons: [
        { code: "Space", label: "CAÍDA" },
        { code: "ArrowUp", label: "ROTAR" },
      ],
    },
  },
  {
    id: "arkanoid",
    title: "ARKANOID",
    short: "Rompe el muro ladrillo a ladrillo en cinco niveles.",
    long: "Mueve la paleta con el ratón o las flechas y mantén la pelota en juego. Cada bloque vale 10 puntos y, al limpiar la pantalla, pasas al siguiente de cinco niveles, cada uno con su propia forma y una pelota más rápida. Tienes tres vidas: supera el quinto nivel para completar el juego.",
    cat: "ARCADE",
    cover: "cover-bricks",
    color: "cyan",
    src: "/games/arkanoid/index.html",
    controls: {
      pad: [
        { code: "ArrowLeft", dir: "left" },
        { code: "ArrowRight", dir: "right" },
      ],
      buttons: [],
    },
  },
  {
    id: "snake",
    title: "SNAKE",
    short: "Come frutas, crece y no te muerdas la cola.",
    long: "Guía la serpiente con las flechas o WASD por un tablero de 20×14. Cada fruta suma 10 puntos por nivel y te hace crecer. Cada 5 frutas subes de nivel y la serpiente acelera. Si chocas con la pared o con tu propio cuerpo, se acabó.",
    cat: "ARCADE",
    cover: "cover-snake",
    color: "green",
    src: "/games/snake/index.html",
    controls: {
      pad: [
        { code: "ArrowUp", dir: "up" },
        { code: "ArrowLeft", dir: "left" },
        { code: "ArrowRight", dir: "right" },
        { code: "ArrowDown", dir: "down" },
      ],
      buttons: [],
    },
  },
  {
    id: "frogger",
    title: "FROGGER",
    short: "Cruza la carretera y el río sin convertirte en papilla.",
    long: "Guía a tu rana con las flechas o WASD a través de una carretera repleta de coches y un río de troncos y tortugas flotantes. Llena las cinco bocas del otro lado para completar la ronda; cada nivel acelera el tráfico y acorta el tiempo. Tres vidas y mucho asfalto por delante.",
    cat: "ARCADE",
    cover: "cover-frogger",
    color: "green",
    src: "/games/frogger/index.html",
    controls: {
      pad: [
        { code: "ArrowUp", dir: "up" },
        { code: "ArrowLeft", dir: "left" },
        { code: "ArrowRight", dir: "right" },
        { code: "ArrowDown", dir: "down" },
      ],
      buttons: [],
    },
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
