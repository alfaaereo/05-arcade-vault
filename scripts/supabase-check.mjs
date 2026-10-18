// Comprueba la conexión con Supabase usando las variables de .env.local.
// Uso: npm run supabase:check
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local.",
  );
  process.exit(1);
}
try {
  const res = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: key },
  });
  if (!res.ok) {
    console.error(`SUPABASE ERROR ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  console.log("SUPABASE OK");
} catch (error) {
  console.error(
    "SUPABASE ERROR:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
