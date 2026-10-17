"use server";

import { Resend } from "resend";
import { buildContactEmail } from "@/lib/contact-email";

export type ContactState =
  | { status: "idle" }
  | { status: "sent"; name: string }
  | { status: "invalid" }
  | { status: "error" };

const field = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

// Envía el mensaje al equipo. Al cliente solo le llega el estado, nunca el detalle del error.
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const msg = field(formData, "msg");
  if (!name || !email || !msg) return { status: "invalid" };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("[contacto] Faltan variables de entorno: RESEND_API_KEY, CONTACT_TO_EMAIL o CONTACT_FROM_EMAIL.");
    return { status: "error" };
  }

  try {
    const { subject, html, text } = buildContactEmail({ name, email, msg });
    const { error } = await new Resend(apiKey).emails.send({ from, to, replyTo: email, subject, html, text });
    if (error) {
      console.error("[contacto] Resend rechazó el envío:", error);
      return { status: "error" };
    }
  } catch (err) {
    console.error("[contacto] Error al llamar a Resend:", err);
    return { status: "error" };
  }

  return { status: "sent", name };
}
