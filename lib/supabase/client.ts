import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
// Cliente para Client Components. createBrowserClient reutiliza una única
// instancia en el navegador y guarda la sesión en cookies.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
