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
) => {
  const data = { name, email, tempPassword, APP_DOMAIN };
  const templateName = "welcomeEmail";
  const html = renderTemplate(templateName, data, "html");
  const text = renderTemplate(templateName, data, "txt");

  await transporter.sendMail({
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

  await transporter.sendMail({
    from: BREVO_EMAIL_SENDER,
    to,
    subject: SUCCESS.RESET_EMAIL_SUBJECT,
    html,
    text,
  });
};