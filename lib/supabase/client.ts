import { createBrowserClient } from "@supabase/ssr";
// Cliente para Client Components. createBrowserClient reutiliza una única
// instancia en el navegador y guarda la sesión en cookies.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
