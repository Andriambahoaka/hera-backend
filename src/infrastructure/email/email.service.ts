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


// email.service.ts

interface SendEmailParams {
  subject: string;
  email: string;
  name: string;
  data: Record<string, unknown>;
}

const sendEmail = async ({
  subject,
  email,
  name,
  data,
}: SendEmailParams): Promise<void> => {
  const templateData = {
    ...data,
    APP_URL: APP_DOMAIN,
  };

  const html = renderTemplate("accountCreated", templateData, "html");
  const text = renderTemplate("accountCreated", templateData, "txt");

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { email: BREVO_EMAIL_SENDER },
      to: [{ email, name }],
      subject,
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


export const sendWelcomeEmail = async (
  name: string,
  email: string,
  tempPassword: string
) => {
  await sendEmail({
    subject: SUCCESS.WELCOME_EMAIL_SUBJECT,
    email,
    name,
    data: {
      name,
      email,
      tempPassword,
    },
  });
};

export const sendMemberInviteEmail = async (
  ownerName: string,
  name: string,
  email: string,
  tempPassword: string
) => {
  await sendEmail({
    subject: SUCCESS.MEMBER_INVITE_SUBJECT,
    email,
    name,
    data: {
      ownerName,
      name,
      email,
      tempPassword,
    },
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