export type ContactMessage = { name: string; email: string; msg: string };

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

// Correo interno al equipo: los valores del usuario van escapados en el HTML.
export function buildContactEmail(m: ContactMessage): { subject: string; html: string; text: string } {
  const subject = `[Arcade Vault] Mensaje de ${m.name}`;

  const name = escapeHtml(m.name);
  const email = escapeHtml(m.email);
  const msg = escapeHtml(m.msg).replace(/\r?\n/g, "<br>");

  const html = `<div style="font-family: monospace; font-size: 14px; line-height: 1.6;">
<h2 style="margin: 0 0 12px;">Nuevo mensaje de contacto</h2>
<p style="margin: 0;"><strong>Nombre:</strong> ${name}</p>
<p style="margin: 0 0 12px;"><strong>Correo:</strong> ${email}</p>
<p style="margin: 0;">${msg}</p>
</div>`;

  const text = `Nuevo mensaje de contacto

Nombre: ${m.name}
Correo: ${m.email}

${m.msg}
`;

  return { subject, html, text };
}
