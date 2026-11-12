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


/**
 * Sends through Brevo SMTP and logs why a send failed (connection, auth, sender...).
 * Never logs credentials, the recipient address or the message content.
 */
const send = async (template: string, mail: nodemailer.SendMailOptions) => {
  try {
    await transporter.sendMail(mail);
  } catch (err: any) {
    console.error(
      `[email] ${template} send failed:`,
      JSON.stringify({
        code: err?.code,                 // e.g. ETIMEDOUT, ECONNECTION, EAUTH, EENVELOPE
        command: err?.command,           // SMTP step: CONN, AUTH PLAIN, MAIL FROM, RCPT TO...
        responseCode: err?.responseCode, // SMTP reply code from Brevo
        response: err?.response,
        message: err?.message,
        smtpUserSet: Boolean(BREVO_SMTP_USERNAME),
        smtpPasswordSet: Boolean(BREVO_SMTP_PASSWORD),
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
    from: BREVO_EMAIL_SENDER,
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
  const data = { name: name || "Utilisateur", to, resetLink ,APP_DOMAIN };
  const templateName = "resetPasswordEmail";
  const html = renderTemplate(templateName, data, "html");
  const text = renderTemplate(templateName, data, "txt");

  await send(templateName, {
    from: BREVO_EMAIL_SENDER,
    to,
    subject: SUCCESS.RESET_EMAIL_SUBJECT,
    html,
    text,
  });
};