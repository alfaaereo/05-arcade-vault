import Link from "next/link";
import { notFound } from "next/navigation";
import { formatScore, GAMES, getGame, seededScores } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

const TOP_CLASS = ["top1", "top2", "top3"];

export default async function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  const scores = seededScores(id.length * 17 + 3, 10);

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={`cover-bg ${game.cover}`}></div>
        </div>
        <div className="detail-info mt-5">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div className="v text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]">
                {formatScore(game.best)}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div className="v text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">★ ★ ★ ☆ ☆</div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/juegos/${game.id}/jugar`} className="btn xl pulse">
              ▶  JUGAR AHORA
            </Link>
            <Link href="/games" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {scores.map((r, i) => (
            <div key={r.name} className={`lb-row ${TOP_CLASS[i] ?? ""}`}>
              <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
              <div className="pl">
                {r.name}
                <div className="text-[10px] tracking-[0.1em] text-ink-faint">{r.date}</div>
              </div>
              <div className="sc">{formatScore(r.score)}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
