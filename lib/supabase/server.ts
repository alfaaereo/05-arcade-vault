import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// Cliente para Server Components, Server Actions y Route Handlers.
// Se crea en cada petición: nunca guardarlo en una variable global.
// Ojo: leer cookies() vuelve dinámica la ruta; envolver en <Suspense> lo que lo use.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
            // Un Server Component no puede escribir cookies; se ignora.
          }
        },
      },
    },
  );
}
