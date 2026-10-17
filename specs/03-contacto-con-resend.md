# SPEC 03 — Envío del formulario de contacto con Resend

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-10-16
> **Objetivo:** Hacer que el formulario de contacto de `/about` envíe un correo real con Resend a la dirección configurada en `CONTACT_TO_EMAIL`, manteniendo intacto el diseño de la plantilla.

## Por qué existe este spec

SPEC 02 portó `/about` desde `references/templates/home-about/about.jsx` con un formulario solo visual y dejó explícitamente el envío real fuera de alcance. Este spec cubre ese envío. La página y el formulario ya coinciden con la plantilla. Lo único que cambia es qué pasa al pulsar "▶  ENVIAR MENSAJE".

## Alcance

**Entra:**

- Dependencia `resend` (SDK oficial).
- Server Action `sendContact` en `app/about/actions.ts` (`"use server"`), que lee `name`, `email` y `msg` del `FormData`.
- Validación en el servidor: los tres campos son obligatorios tras `trim` (la misma regla que en el cliente).
- Envío de un único correo a `CONTACT_TO_EMAIL`, con `from` = `CONTACT_FROM_EMAIL` (`onboarding@resend.dev`, porque el usuario no tiene dominio verificado) y `replyTo` = el correo del usuario.
- Asunto: `[Arcade Vault] Mensaje de {nombre}`.
- Cuerpo en HTML simple y en texto plano, generado por `lib/contact-email.ts` y con los valores del usuario escapados en el HTML.
- `ContactForm` usa `useActionState(sendContact, …)` con estos estados:
  - Validación del cliente: si falta algún campo, el formulario tiembla 400 ms y no llama a la acción (comportamiento actual).
  - Pendiente: el botón muestra "ENVIANDO…" y está deshabilitado, y los campos llevan `readOnly` (no `disabled`, que los sacaría del `FormData`).
  - `invalid` devuelto por el servidor: el formulario tiembla 400 ms igual que con la validación del cliente, y los campos se conservan.
  - Éxito: la terminal actual "VAULT-OS // TERMINAL" con "GRACIAS, {NOMBRE}." Solo aparece cuando Resend confirma el envío.
  - Error: una terminal VAULT-OS con la misma estética, líneas `[OK] Conectando con servidor…` y `[ERR] No se pudo transmitir el paquete.`, y el mensaje "> ERROR AL ENVIAR. INTÉNTALO DE NUEVO." en rojo. El botón "REINTENTAR" vuelve al formulario con los campos conservados.
  - "ENVIAR OTRO MENSAJE" sigue limpiando el formulario.
- Variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (valor: `alfaaereo@gmail.com`) y `CONTACT_FROM_EMAIL`, leídas solo en el servidor (sin prefijo `NEXT_PUBLIC_`).
- `.env.template` versionado con las tres claves y la API key vacía. La API key real solo vive en `.env.local`, que ya ignora la regla `.env*` de `.gitignore`.
- Si falta alguna variable, la acción no lanza una excepción: devuelve un error, registra `console.error` en el servidor y el usuario ve la terminal de error.
- Estilos para la variante de error como modificador `.terminal-success.is-error` (borde, `box-shadow` y `text-shadow` en `--magenta`; el tema no tiene `--red`) en `app/globals.css`, junto a las reglas `.term-*` existentes.
- Actualizar `CLAUDE.md`: el formulario de contacto ya envía correo, más las variables de entorno necesarias.

**Fuera de alcance (para specs futuros):**

- Acuse de recibo al usuario.
- Validación del formato del correo y límites de longitud en el servidor (más allá de `type="email"` en el navegador).
- Antispam: honeypot, captcha y rate limit.
- Plantillas con React Email.
- Guardar los mensajes en una base de datos.
- Cambios visuales en `/about` fuera de los estados pendiente y error.
- Framework de tests.

## Modelo de datos

```ts
// app/about/actions.ts
export type ContactState =
  | { status: "idle" }
  | { status: "sent"; name: string }          // nombre recortado, para "GRACIAS, {NOMBRE}."
  | { status: "invalid" }                     // algún campo vacío tras trim (defensa en servidor)
  | { status: "error" };                      // fallo de Resend o configuración ausente

export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState>;

// lib/contact-email.ts
export type ContactMessage = { name: string; email: string; msg: string };
export function buildContactEmail(m: ContactMessage): { subject: string; html: string; text: string };
```

```bash
# .env.template
RESEND_API_KEY=
CONTACT_TO_EMAIL=alfaaereo@gmail.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

Convenciones:

- Los inputs llevan `name="name" | "email" | "msg"` para que el `FormData` los incluya.
- El estado de los campos sigue controlado en el cliente, para conservarlos al reintentar y limpiarlos con "ENVIAR OTRO MENSAJE".
- El cliente recibe `{ status: "error" }` sin detalle. Nunca recibe mensajes de Resend ni la API key.
- `buildContactEmail` escapa `& < > " '` en el HTML y convierte los saltos de línea del mensaje en `<br>`.

## Plan de implementación

Antes de empezar, leer `node_modules/next/dist/docs/01-app/02-guides/forms.md`, `server-actions.md` y `environment-variables.md`. Usar `/frontend-design` para los estados pendiente y error, como indica `CLAUDE.md`.

1. `npm install resend`. Crear `.env.template` con las tres claves. Verificación: `next build` compila.
2. Crear `lib/contact-email.ts` con `buildContactEmail` (asunto, HTML escapado y texto). Verificación: `next build` compila.
3. Crear `app/about/actions.ts` con `ContactState` y `sendContact`: lee y recorta los campos, devuelve `invalid` si falta alguno, devuelve `error` si falta alguna variable de entorno y, si no, llama a `resend.emails.send({ from, to, replyTo, subject, html, text })`. Devuelve `sent` solo si la respuesta no trae `error`. Verificación: `next build` compila.
4. Conectar `components/contact-form.tsx` a la acción con `useActionState`: añadir `name` a los inputs, mantener la validación previa con temblor (y temblar también si el servidor devuelve `invalid`), mostrar "ENVIANDO…" con el botón deshabilitado y los campos `readOnly` mientras está pendiente, y mostrar la terminal de éxito cuando el estado es `sent`. Verificación: con `.env.local` válido, enviar el formulario hace llegar el correo a `alfaaereo@gmail.com`.
5. Añadir la terminal de error y el botón "REINTENTAR", más el modificador `.terminal-success.is-error` en `app/globals.css`. Verificación: sin `RESEND_API_KEY` se ve la terminal de error y "REINTENTAR" conserva los campos.
6. Actualizar `CLAUDE.md`: el formulario de contacto envía con Resend vía Server Action, y las variables `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` en `.env.local`.

## Criterios de aceptación

- [x] `next build` termina sin errores ni advertencias de TypeScript.
- [x] `/about` sigue siendo idéntica a la plantilla a 1280px antes de enviar.
- [x] La consola del navegador no muestra errores ni advertencias de hidratación en `/about`.
- [x] Enviar con algún campo vacío o solo con espacios hace temblar el formulario y no hace ninguna petición de red.
- [x] Mientras se envía, el botón muestra "ENVIANDO…" y está deshabilitado.
- [x] Con `.env.local` válido, enviar nombre "px_kai", un correo y un mensaje muestra "GRACIAS, PX_KAI." y llega un correo a `alfaaereo@gmail.com` con asunto "[Arcade Vault] Mensaje de px_kai".
- [x] Pulsar "Responder" en ese correo dirige la respuesta al correo escrito en el formulario.
- [x] Un mensaje que contiene `<b>hola</b>` aparece en el correo como texto literal, no en negrita.
- [x] Los saltos de línea del mensaje se conservan en el correo.
- [x] Sin `RESEND_API_KEY` (o con una clave inválida), se muestra la terminal de error y el servidor registra el error en consola.
- [x] "REINTENTAR" vuelve al formulario con los tres campos conservados.
- [x] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [x] `RESEND_API_KEY` no aparece en el bundle del cliente ni en ninguna respuesta de red.
- [x] `.env.template` está versionado y `.env.local` no aparece en `git status`.

## Decisiones

- **Sí:** Server Action con `useActionState`. Es el patrón nativo de Next 16, no expone un endpoint público y trae el estado `pending`.
- **No:** Route Handler `/api/contact`. Solo lo usaría este formulario.
- **Sí:** destinatario y remitente en variables de entorno (`CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`). Se pueden cambiar sin desplegar código.
- **Sí:** remitente `onboarding@resend.dev`. El usuario no tiene dominio verificado, y este remitente solo entrega al dueño de la cuenta de Resend, que debe ser `alfaaereo@gmail.com`. Si más adelante se verifica un dominio, basta con cambiar `CONTACT_FROM_EMAIL`.
- **No:** remitente en un dominio propio por ahora. No hay dominio verificado.
- **Sí:** campos `readOnly` durante el envío. Con `disabled` no se incluirían en el `FormData`.
- **Sí:** si el servidor devuelve `invalid`, el formulario tiembla como en la validación del cliente. Para el usuario es el mismo error.
- **Sí:** la variante de error es un modificador `.is-error` sobre `.terminal-success`, en `--magenta`. Reutiliza la estructura de la terminal y el tema no tiene `--red`.
- **Sí:** un único correo al equipo con `replyTo` = el correo del usuario.
- **No:** acuse al usuario. Permitiría usar el formulario para mandar correos a terceros.
- **Sí:** validación del servidor limitada a campos obligatorios, por decisión del usuario.
- **No:** validar el formato del correo ni las longitudes en el servidor, ni añadir zod.
- **No:** antispam por ahora, por decisión del usuario. Si aparece spam, irá en su propio spec.
- **Sí:** HTML simple más texto, escapado a mano en `lib/contact-email.ts`. No añade dependencias.
- **No:** React Email. Aporta más dependencias que valor para un correo interno.
- **Sí:** la terminal de error con estética VAULT-OS y "REINTENTAR" que conserva los campos. Encaja con la terminal de éxito.
- **Sí:** la terminal de éxito solo aparece si Resend confirma el envío. Hoy aparece siempre.
- **Sí:** la API key nunca va en el repo, en el spec ni en el chat. Solo vive en `.env.local`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La API key se filtra al repo o al cliente. | `.env*` ya está ignorado, solo `.env.template` se versiona con la clave vacía, no se usa el prefijo `NEXT_PUBLIC_` y la clave solo se lee dentro de `actions.ts`. Hay un criterio de aceptación que lo comprueba. |
| `onboarding@resend.dev` solo entrega al dueño de la cuenta: si la cuenta de Resend no es `alfaaereo@gmail.com`, Resend rechaza el envío. | La acción devuelve `error` y registra el mensaje de Resend en el servidor. El destinatario debe ser el correo de la cuenta de Resend, o hay que verificar un dominio y cambiar `CONTACT_FROM_EMAIL`. |
| Spam o abuso sin antispam: llenan el buzón o gastan la cuota de Resend. | Solo se envía al equipo (sin acuse), así que no se puede usar para mandar correos a terceros. El antispam queda como spec futuro. |
| Inyección de HTML en el correo. | `buildContactEmail` escapa los valores. Hay un criterio con `<b>hola</b>`. |
| Con Cache Components, usar una Server Action convierte `/about` en dinámica. | La acción solo se ejecuta al enviar. `/about` sigue siendo estática y `next build` lo confirma. |

## Lo que **no** entra en este spec

- Acuse de recibo al usuario.
- Validación de formato o longitud en el servidor.
- Antispam (honeypot, captcha, rate limit).
- React Email.
- Guardar los mensajes.
- Tests.

Cada uno de estos, si llega, va en su propio spec.

