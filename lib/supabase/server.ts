import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";
// Cliente para Server Components, Server Actions y Route Handlers.
// Se crea en cada petición: nunca guardarlo en una variable global.
// Ojo: leer cookies() vuelve dinámica la ruta; envolver en <Suspense> lo que lo use.
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Un Server Component no puede escribir cookies. El proxy refresca la sesión.
        }
      },
    },
  });
}
