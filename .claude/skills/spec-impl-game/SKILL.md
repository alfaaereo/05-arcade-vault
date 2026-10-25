---
name: spec-impl-game
description: Implementa un spec de juego aprobado (specs/NN-juego-<id>.md) con el flujo exacto de /spec-impl y, al terminar, lanza en serie los subagentes skin-designer (3 skins × 2 modos), mobile-porte (móvil) y game-performance-booster (rendimiento). Los cambios de los agentes quedan sin commitear para revisarlos.
disable-model-invocation: true
argument-hint: <NN-juego-id>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Agent, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*), Bash(curl:*)
---

# /spec-impl-game — Implementar un juego y pulirlo (skins + móvil + rendimiento)

## Contexto de sesión

Estado del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles:
!`ls specs/ 2>/dev/null || echo "No existe la carpeta specs/"`

Configuración de ramas:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, no config file)"`

Juegos servidos desde public/:
!`ls public/games/ 2>/dev/null || echo "No hay juegos en public/games/"`

---

Este comando es `/spec-impl` más tres pasos finales. **No dupliques ni reinterpretes `/spec-impl`**: su flujo vive en `.claude/skills/spec-impl/SKILL.md` (fijado desde Klerith/fernando-skills, no se edita) y se sigue tal cual. Responde en español.

## Fase 0 — Comprobar que es un spec de juego

El argumento recibido es: `$ARGUMENTS`

- Resuelve el spec igual que la Fase 1 de `/spec-impl` (nombre completo, solo número o solo slug).
- Debe ser un archivo `specs/NN-juego-<id>.md`. El `<id>` del juego es lo que va tras `NN-juego-` (p. ej. `09-juego-snake.md` → `snake`).
- Si el spec no sigue el patrón `NN-juego-*`, para y di: "Este spec no es de un juego. Usa `/spec-impl <spec>`." No hagas nada más.

## Fases 1–4 — Implementación con /spec-impl

Lee `.claude/skills/spec-impl/SKILL.md` y ejecuta sus **Fases 1 a 4 al pie de la letra**, con `$ARGUMENTS` como argumento: identificación del spec, validación del estado "Aprobado", rama `spec-NN-slug`, resumen del spec e implementación paso a paso **con sus pausas y sus reglas de commit**. Si cualquiera de esas fases se detiene (spec no aprobado, cambios pendientes, ambigüedad…), esta skill también se detiene.

Cuando termines el último paso del plan, **no muestres todavía** el mensaje final de `/spec-impl` ("✅ All steps of the plan are implemented…"): pasa a la Fase 5.

## Fase 5 — Skins, móvil y rendimiento (en serie, nunca en paralelo)

1. Comprueba que `<id>` está en `GAMES` de `lib/games.ts` y que existe `public/games/<id>/`. Si falta algo, para y explica qué falta.
2. Comprueba el servidor de desarrollo: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3123`. Si no responde 200, pide a la persona que ejecute `npm run dev` y espera. No lo arranques tú y no ejecutes `next build` (rompe los servidores abiertos).
3. Di: `Implementación terminada. ¿Lanzo skin-designer para <id>?` y espera confirmación.
4. Lanza el subagente con la herramienta `Agent`, **en primer plano, esperando su resultado**:
   - `subagent_type: "skin-designer"`
   - `prompt`: `Añade las 3 skins obligatorias (clasico, neon, retro), cada una en oscuro y claro, al juego <id>. Spec del juego: specs/NN-juego-<id>.md. Trabaja solo este juego.`
5. Resume su resultado: fila del registro `references/templates/game-width-themes.md` antes → después, paletas y contrastes del modo oscuro, archivos modificados y capturas. Si el agente falló o no terminó, para aquí y explica por qué; no lances mobile-porte.
6. Di: `Skins listas. ¿Lanzo mobile-porte para <id>?` y espera confirmación. Solo entonces lanza:
   - `subagent_type: "mobile-porte"`
   - `prompt`: `Porta el juego <id> a móvil. Ya tiene las 6 skins de skin-designer: comprueba que siguen viéndose bien tras tus cambios. Spec del juego: specs/NN-juego-<id>.md. Trabaja solo este juego.`
7. Resume su resultado: checklist antes → después, archivos modificados, capturas y problemas de plataforma con su propuesta `/spec …`. Si el agente falló o no terminó, para aquí y explica por qué; no lances game-performance-booster.
8. Di: `Móvil listo. ¿Lanzo game-performance-booster para <id>?` y espera confirmación. Solo entonces lanza:
   - `subagent_type: "game-performance-booster"`
   - `prompt`: `Revisa y mejora el rendimiento del juego <id>. Ya tiene las 6 skins de skin-designer y el porte móvil de mobile-porte: mantén su aspecto y su mando. Spec del juego: specs/NN-juego-<id>.md. Trabaja solo este juego.`
9. Resume su resultado: FPS antes → después por skin (reproductor y directo), diagnóstico, archivos modificados, capturas y problemas de plataforma con su propuesta `/spec …`.

Reglas de esta fase:

- Nunca lances dos agentes a la vez ni en segundo plano: mobile-porte empieza solo cuando skin-designer ha terminado, y game-performance-booster solo cuando mobile-porte ha terminado.
- **No hagas commit** de los cambios de los agentes: quedan en el árbol de trabajo para que la persona los revise.
- No corrijas tú lo que los agentes dejen pendiente; repórtalo.

## Fase 6 — Cierre

Muestra `git status --short` y después:

```
✅ Juego implementado, con skins, adaptado a móvil y revisado su rendimiento.

Spec:  specs/NN-juego-<id>.md
Rama:  spec-NN-juego-<id>

Los cambios de skin-designer, mobile-porte y game-performance-booster están SIN COMMITEAR: revisa sus diffs.

Siguiente paso: verifica uno a uno los criterios de aceptación del spec.
Si todos pasan, cambia el estado del spec a "Implementado" y haz el commit
final antes de fusionar la rama.
```

No hagas nada más.
