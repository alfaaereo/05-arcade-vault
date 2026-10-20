import { Suspense } from "react";
import { Library } from "@/components/library";
import { getLibraryGames } from "@/lib/library";
// Lee Supabase en cada petición; la cabecera va en el shell estático.
async function LibraryGames() {
  const result = await getLibraryGames();
  if (result.status === "error")
    return (
      <div className="p-20 text-center text-ink-faint" role="alert">
        <div className="pixel mb-3 text-[14px] text-magenta">
          NO SE PUDO CARGAR LA BIBLIOTECA
        </div>
        <div className="mb-6">
          No hay conexión con el catálogo de juegos. Recarga la página para
          intentarlo de nuevo.
        </div>
        <a href="/games" className="btn magenta">
          RECARGAR
        </a>
      </div>
    );
  return <Library games={result.games} />;
}
export default function GamesPage() {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>
      <Suspense
        fallback={
          <div className="p-20 text-center" role="status">
            <div className="pixel text-[14px] text-cyan">
              CARGANDO BIBLIOTECA…<span className="blink">_</span>
            </div>
          </div>
        }
      >
        <LibraryGames />
      </Suspense>
    </div>
  );
}
