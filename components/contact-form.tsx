"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { sendContact, type ContactState } from "@/app/about/actions";

const EMPTY = { name: "", email: "", msg: "" };
const IDLE: ContactState = { status: "idle" };

function Terminal({ error, children }: { error?: boolean; children: ReactNode }) {
  return (
    <div className={"terminal-success" + (error ? " is-error" : "")} role="status" aria-live="polite">
      <div className="term-bar">
        <span className="dot r"></span>
        <span className="dot y"></span>
        <span className="dot g"></span>
        <span className="term-title">VAULT-OS // TERMINAL</span>
      </div>
      <div className="term-body">
        <div className="line">
          <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
        </div>
        {children}
      </div>
    </div>
  );
}

// Envía el mensaje con la Server Action. Los campos siguen controlados aquí para conservarlos al reintentar.
export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [shake, setShake] = useState(false);
  // Resultado que el usuario ya cerró con "REINTENTAR" o "ENVIAR OTRO MENSAJE".
  const [dismissed, setDismissed] = useState<ContactState>(IDLE);

  const trembleForm = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  // Si el servidor también rechaza los campos, el formulario tiembla igual que en la validación del cliente.
  const [state, dispatch, pending] = useActionState(async (prev: ContactState, data: FormData) => {
    const next = await sendContact(prev, data);
    if (next.status === "invalid") trembleForm();
    return next;
  }, IDLE);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      trembleForm();
      return;
    }
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };

  const retry = () => setDismissed(state);

  const reset = () => {
    setDismissed(state);
    setForm(EMPTY);
  };

  const result = state !== dismissed ? state : IDLE;

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={submit} aria-busy={pending}>
      {result.status === "sent" ? (
        <Terminal>
          <div className="line dim">[OK] Conectando con servidor…</div>
          <div className="line dim">[OK] Validando contenido…</div>
          <div className="line dim">[OK] Transmitiendo paquete…</div>
          <div className="line success">
            &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {result.name.toUpperCase()}.
            <span className="caret">_</span>
          </div>
          <div className="mt-[18px]">
            <button className="btn ghost" type="button" onClick={reset}>
              ENVIAR OTRO MENSAJE
            </button>
          </div>
        </Terminal>
      ) : result.status === "error" ? (
        <Terminal error>
          <div className="line dim">[OK] Conectando con servidor…</div>
          <div className="line err">[ERR] No se pudo transmitir el paquete.</div>
          <div className="line failure">
            &gt; ERROR AL ENVIAR. INTÉNTALO DE NUEVO.
            <span className="caret">_</span>
          </div>
          <div className="mt-[18px]">
            <button className="btn magenta" type="button" onClick={retry}>
              REINTENTAR
            </button>
          </div>
        </Terminal>
      ) : (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              readOnly={pending}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              readOnly={pending}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              readOnly={pending}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
          </div>
          <button className="btn xl press w-full" type="submit" disabled={pending}>
            {pending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}
    </form>
  );
}
