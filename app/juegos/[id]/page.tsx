import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatScore, GAMES, getGame } from "@/lib/games";
import { getGameScores } from "@/lib/leaderboard";
export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}
const TOP_CLASS = ["top1", "top2", "top3"];
// Contador y récord reales; el resto del detalle va en el shell estático.
async function ScoreStats({ id }: { id: string }) {
  const result = await getGameScores(id);
  const ok = result.status === "ok";
  return (
    <>
      <div>
        <div className="l">Puntuaciones</div>
        <div className="v">{ok ? formatScore(result.total) : "—"}</div>
      </div>
      <div>
        <div className="l">Mejor global</div>
        <div className="v text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]">
          {ok ? formatScore(result.best) : "—"}
        </div>
      </div>
    </>
  );
}
function StatsFallback() {
  return (
    <>
      <div>
        <div className="l">Puntuaciones</div>
        <div className="v">…</div>
      </div>
      <div>
        <div className="l">Mejor global</div>
        <div className="v text-magenta">…</div>
      </div>
    </>
  );
}
async function TopScores({ id }: { id: string }) {
  const result = await getGameScores(id);
  if (result.status === "error")
    return (
      <p className="py-6 text-center text-ink-faint" role="alert">
        No se pudieron cargar las puntuaciones. Recarga la página para
        intentarlo de nuevo.
      </p>
    );
  if (result.rows.length === 0)
    return (
      <div className="py-6 text-center">
        <div className="pixel mb-4 text-[11px] text-cyan">
          SIN PUNTUACIONES TODAVÍA
        </div>
        <Link href={`/juegos/${id}/jugar`} className="btn yellow">
          JUGAR AHORA
        </Link>
      </div>
    );
  return result.rows.map((r, i) => (
    <div key={`${r.rank}-${r.name}`} className={`lb-row ${TOP_CLASS[i] ?? ""}`}>
      <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
      <div className="pl">
        {r.name}
        <div className="text-[10px] tracking-[0.1em] text-ink-faint">
          {r.date}
        </div>
      </div>
      <div className="sc">{formatScore(r.score)}</div>
    </div>
  ));
}
export default async function GameDetailPage({
  params,
}: PageProps<"/juegos/[id]">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();
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
            <Suspense fallback={<StatsFallback />}>
              <ScoreStats id={game.id} />
            </Suspense>
            <div>
              <div className="l">Dificultad</div>
              <div className="v text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/juegos/${game.id}/jugar`} className="btn xl pulse">
              ▶ JUGAR AHORA
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
          <Suspense
            fallback={
              <div className="py-6 text-center text-ink-faint" role="status">
                CARGANDO PUNTUACIONES…
              </div>
            }
          >
            <TopScores id={game.id} />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}
