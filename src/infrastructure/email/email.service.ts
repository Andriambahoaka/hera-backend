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


export const sendWelcomeEmail = async (
  name: string,
  email: string,
  tempPassword: string
): Promise<void> => {
 console.log("Sending welcome email to:", APP_DOMAIN);

  const html = renderTemplate(
    "welcomeEmail",
    { name, email, tempPassword, APP_URL: APP_DOMAIN },
    "html"
  );
  const text = renderTemplate(
    "welcomeEmail",
    { name, email, tempPassword, APP_URL: APP_DOMAIN },
    "txt"
  );

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { email: BREVO_EMAIL_SENDER },
      to: [{ email, name }],
      subject: SUCCESS.WELCOME_EMAIL_SUBJECT,
      htmlContent: html,
      textContent: text,
    },
    {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
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
  const resetLink = `${APP_DOMAIN}/deeplink?to=update-password&token=${token}`;

  const html = renderTemplate(
    "resetPasswordEmail",
    { name: name || "Utilisateur", to, resetLink },
    "html"
  );

  const text = renderTemplate(
    "resetPasswordEmail",
    { name: name || "Utilisateur", to, resetLink },
    "txt"
  );

  await transporter.sendMail({
    from: BREVO_EMAIL_SENDER,
    to,
    subject: "Réinitialisation de votre mot de passe – [HERA]",
    html,
    text,
  });
};