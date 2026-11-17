import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import "@/lib/env";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: Transporter | null = null;

function isMailConfigured() {
  return (process.env.MAIL_MAILER ?? "smtp") === "smtp" && Boolean(process.env.MAIL_HOST);
}

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.MAIL_PORT ?? 587);
    const username = process.env.MAIL_USERNAME;
    const password = process.env.MAIL_PASSWORD;

    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port,
      secure: process.env.MAIL_SCHEME === "smtps" || port === 465,
      auth: username && username !== "null" ? { user: username, pass: password } : undefined,
    });
  }

  return transporter;
}

function getFromAddress() {
  const address = process.env.MAIL_FROM_ADDRESS ?? "no-reply@example.com";
  const name = process.env.MAIL_FROM_NAME;

  return name && !name.includes("${") ? { name, address } : address;
}

/**
 * Sends an email through SMTP (MAIL_MAILER=smtp + MAIL_HOST).
 * Outside production, an unconfigured mailer logs the message to the server console instead.
 */
export async function sendMail(message: MailMessage) {
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Mailer is not configured. Set MAIL_MAILER=smtp and MAIL_HOST.");
    }

    console.info(`[mail:log] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`);
    return;
  }

  await getTransporter().sendMail({ from: getFromAddress(), ...message });
}
