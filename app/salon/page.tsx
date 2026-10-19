import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HallOfFame, HallTerminal } from "@/components/hall-of-fame";
import { getLeaderboards } from "@/lib/leaderboard";
export const metadata: Metadata = {
  title: "Salón de la Fama · Arcade Vault",
};
// Lee Supabase en cada petición; el resto de la página va en el shell estático.
async function SalonBoards() {
  const leaderboards = await getLeaderboards();
  return <HallOfFame leaderboards={leaderboards} />;
}
export default function SalonPage() {
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel text-[10px]">
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>
      <Suspense
        fallback={
          <HallTerminal>
            <div className="line dim">
              CARGANDO SALÓN…<span className="caret">_</span>
            </div>
          </HallTerminal>
        }
      >
        <SalonBoards />
      </Suspense>
      <div className="mt-8 text-center">
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
