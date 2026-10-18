import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Desactiva reglas de estilo que chocan con Prettier (debe ir al final).
  prettier,
  // Código conciso: sin líneas en blanco (respeta template literals).
  {
    rules: {
      "no-multiple-empty-lines": ["error", { max: 0, maxBOF: 0, maxEOF: 0 }],
    },
  },
]);
export default eslintConfig;
