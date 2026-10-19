import { notFound } from "next/navigation";
import { EmbeddedGamePlayer } from "@/components/embedded-game-player";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";
export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}
export default async function GamePlayerPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();
  // Con src se juega el juego real embebido; sin src, la partida simulada.
  if (game.src) return <EmbeddedGamePlayer game={{ ...game, src: game.src }} />;
  return <GamePlayer game={game} />;
}
