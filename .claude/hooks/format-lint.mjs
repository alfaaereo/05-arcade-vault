// Hook PostToolUse (Write|Edit): formatea con Prettier y corrige con ESLint
// los archivos React/TS/JS y Markdown que Claude crea o edita.
// ESLint (no-multiple-empty-lines con max 0) elimina las líneas en blanco
// del código; en Markdown se conservan porque separan bloques.
// Si ESLint deja errores, sale con código 2 para que Claude los corrija.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
const LINT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const FORMAT_EXTS = new Set([...LINT_EXTS, ".md"]);
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const filePath = input?.tool_input?.file_path;
if (!filePath) process.exit(0);
const ext = path.extname(filePath).toLowerCase();
if (!FORMAT_EXTS.has(ext)) process.exit(0);
// Solo archivos dentro del proyecto.
const rel = path.relative(projectDir, path.resolve(projectDir, filePath));
if (rel.startsWith("..") || path.isAbsolute(rel)) process.exit(0);
const bin = (p) => path.join(projectDir, "node_modules", p);
const run = (script, args) =>
  spawnSync(process.execPath, [bin(script), ...args], {
    cwd: projectDir,
    encoding: "utf8",
  });
// --ignore-unknown evita fallos con archivos que Prettier no sabe parsear;
// los ignorados por .prettierignore se saltan solos.
run("prettier/bin/prettier.cjs", ["--write", "--ignore-unknown", rel]);
if (LINT_EXTS.has(ext)) {
  // --max-warnings 0: los warnings también se reportan a Claude.
  const res = run("eslint/bin/eslint.js", [
    "--fix",
    "--no-warn-ignored",
    "--max-warnings",
    "0",
    rel,
  ]);
  if (res.status !== 0) {
    process.stderr.write(
      `ESLint encontró problemas en ${rel}:\n${res.stdout}${res.stderr}`,
    );
    process.exit(2);
  }
}
process.exit(0);
