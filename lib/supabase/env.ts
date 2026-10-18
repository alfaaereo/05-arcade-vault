// Acceso literal a process.env: Next solo incrusta en el bundle del cliente las
// variables NEXT_PUBLIC_* escritas así, no con process.env[name].
export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url)
    throw new Error("Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL.");
  if (!publishableKey)
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  return { url, publishableKey };
}
