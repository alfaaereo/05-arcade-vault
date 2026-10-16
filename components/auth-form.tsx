"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Tab = "in" | "up";

// Solo visual: no autentica ni guarda sesión, siempre vuelve a la Biblioteca.
export function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("in");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push("/games");
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="mark"></div>
        <h2 className="neon-cyan">ARCADE VAULT</h2>
        <div className="mono mt-1.5 text-[11px] tracking-[0.16em] text-ink-faint">
          ACCESO AL SISTEMA · v2.6
        </div>
      </div>

      <div className="auth-tabs">
        <button className={tab === "in" ? "on" : ""} onClick={() => setTab("in")}>
          INICIAR SESIÓN
        </button>
        <button className={tab === "up" ? "on" : ""} onClick={() => setTab("up")}>
          CREAR CUENTA
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="auth-user">Usuario</label>
          <input id="auth-user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="px_kai" />
        </div>
        {tab === "up" && (
          <div className="field slide-in">
            <label htmlFor="auth-email">Correo electrónico</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-pass">Contraseña</label>
          <input
            id="auth-pass"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button className="btn lg mt-2 w-full" type="submit">
          {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
        </button>
      </form>

      <button className="btn ghost mt-2.5 w-full" onClick={() => router.push("/games")}>
        JUGAR COMO INVITADO
      </button>

      <div className="mt-[18px] text-center text-[11px] tracking-[0.1em] text-ink-faint">
        AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
      </div>
    </div>
  );
}
