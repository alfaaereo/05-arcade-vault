import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";
// Refresca el token de sesión y lo devuelve en las cookies de la respuesta.
// No redirige: proteger rutas llegará con el spec de autenticación.
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  try {
    const { url, publishableKey } = getSupabaseEnv();
    const supabase = createServerClient<Database>(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    });
    // No meter código entre createServerClient y getClaims(): podría cerrar la sesión sin aviso.
    await supabase.auth.getClaims();
  } catch (error) {
    // Si Supabase falla o faltan variables, la página debe seguir cargando.
    console.error("[supabase] No se pudo refrescar la sesión:", error);
    return NextResponse.next({ request });
  }
  // Devolver siempre esta misma respuesta: lleva las cookies que escribió setAll.
  return response;
}
