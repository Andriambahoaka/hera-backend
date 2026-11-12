import { renderTemplate } from "./renderTemplate";
import nodemailer from "nodemailer";
import { SUCCESS } from "../../core/utils/messages.util";
import axios from "axios";

// =============================
// ENV & CONSTANTS
// =============================
const {
  BREVO_EMAIL_SENDER,
  BREVO_SMTP_USERNAME,
  BREVO_SMTP_PASSWORD,
  BREVO_API_KEY,
  APP_DOMAIN = "",
} = process.env;


// =============================
// MAILER
// =============================
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: BREVO_SMTP_USERNAME,
    pass: BREVO_SMTP_PASSWORD,
  },
  connectionTimeout: 10000,
});


const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/** "Hera <noreply@x.fr>" or "noreply@x.fr" -> Brevo API sender object. */
export const parseSender = (sender = "") => {
  const m = sender.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim() || undefined, email: m[2].trim() } : { email: sender.trim() };
};

type Mail = { to: string; subject: string; html: string; text: string };

/**
 * Brevo transactional API over HTTPS (port 443). Used whenever BREVO_API_KEY is
 * set: hosts like Render's free plan block outgoing SMTP ports (25/465/587).
 */
const sendWithApi = (mail: Mail) =>
  axios.post(
    BREVO_API_URL,
    {
      sender: parseSender(BREVO_EMAIL_SENDER),
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
    },
    { headers: { "api-key": BREVO_API_KEY!, accept: "application/json" }, timeout: 10000 }
  );

const sendWithSmtp = (mail: Mail) =>
  transporter.sendMail({ from: BREVO_EMAIL_SENDER, ...mail });

/**
 * Sends one email and logs why a send failed. Never logs credentials,
 * the recipient address or the message content.
 */
const send = async (template: string, mail: Mail) => {
  const via = BREVO_API_KEY ? "api" : "smtp";
  try {
    await (via === "api" ? sendWithApi(mail) : sendWithSmtp(mail));
  } catch (err: any) {
    console.error(
      `[email] ${template} send failed (${via}):`,
      JSON.stringify({
        code: err?.code,                 // ETIMEDOUT, ECONNECTION, EAUTH, EENVELOPE, ERR_BAD_REQUEST...
        command: err?.command,           // SMTP step: CONN, AUTH PLAIN, MAIL FROM, RCPT TO...
        responseCode: err?.responseCode, // SMTP reply code
        response: typeof err?.response === "string" ? err.response : undefined, // SMTP reply text
        status: err?.response?.status,   // API HTTP status (401 bad key, 400 bad sender...)
        apiError: err?.response?.data,   // API error body: { code, message }
        message: err?.message,
        senderSet: Boolean(BREVO_EMAIL_SENDER),
      })
    );
    throw err;
  }
};

export const sendWelcomeEmail = async (
  name: string,
  email: string,
  tempPassword: string
) => {
  const data = { name, email, tempPassword, APP_DOMAIN };
  const templateName = "welcomeEmail";
  const html = renderTemplate(templateName, data, "html");
  const text = renderTemplate(templateName, data, "txt");

  await send(templateName, {
    to: email,
    subject: SUCCESS.WELCOME_EMAIL_SUBJECT,
    html,
    text,
  });

};

export const sendResetPasswordEmail = async ({
  to,
  name,
  token,
}: {
  to: string;
  name?: string;
  token: string;
}) => {
  
  // Direct Universal Link / App Link (a redirect would not open the app on iOS).
  const resetLink = `${APP_DOMAIN}/update-password?token=${encodeURIComponent(token)}`;
  console.log(`Sending reset password email to ${to} with link: ${resetLink}`);
  const data = { name: name || "Utilisateur", to, resetLink ,APP_DOMAIN };
  const templateName = "resetPasswordEmail";
  const html = renderTemplate(templateName, data, "html");
  const text = renderTemplate(templateName, data, "txt");

  await send(templateName, {
    to,
    subject: SUCCESS.RESET_EMAIL_SUBJECT,
    html,
    text,
  });
};