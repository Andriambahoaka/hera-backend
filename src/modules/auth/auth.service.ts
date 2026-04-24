import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

import User from "../../models/user.model";
import ApiKey from "../../models/apiKey.model";

import { renderTemplate } from "../../core/utils/emailTemplate.util";
import { validateSignupInput } from "../../core/utils/validators";
import { ERRORS, SUCCESS } from "../../core/utils/messages.util";

dotenv.config();

// =============================
// ENV & CONSTANTS
// =============================
const {
  BREVO_EMAIL_SENDER,
  BREVO_SMTP_USERNAME,
  BREVO_SMTP_PASSWORD,
  BREVO_API_KEY,
  JWT_SECRET = "",
  RESET_PASSWORD_SECRET = "",
  APP_DOMAIN = "",
} = process.env;

const TOKEN_EXPIRY = "24h";
const RESET_EXPIRY = "1h";

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

// =============================
// HELPERS
// =============================
const generateToken = (
  userId: mongoose.Types.ObjectId,
  secret: string,
  expiresIn: SignOptions['expiresIn']

): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign({ userId: userId.toString() }, secret, options);
};

const generateTempPassword = (length = 12): string => {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
};

const sendWelcomeEmail = async (
  name: string,
  email: string,
  tempPassword: string
): Promise<void> => {
  const html = renderTemplate(
    "welcomeEmail",
    { name, email, tempPassword },
    "html"
  );
  const text = renderTemplate(
    "welcomeEmail",
    { name, email, tempPassword },
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

// =============================
// SERVICES
// =============================
export const signupService = async (data: any) => {
  const { name, email, password, phoneNumber, userType, ownerId } = data;

  const validationError = await validateSignupInput(data, User);
  if (validationError) {
    throw new Error(validationError);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error(ERRORS.USER_EXISTS);
  }

  const tempPassword = password || generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    phoneNumber: phoneNumber || null,
    userType,
    ownerId,
  });

  const savedUser = await user.save();
  await sendWelcomeEmail(name, email, tempPassword);

  return {
    message: SUCCESS.USER_CREATED,
    userId: savedUser._id,
  };
};

export const loginService = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error(ERRORS.USER_NOT_FOUND);

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error(ERRORS.CREDENTIALS_INCORRECT);

  const token = generateToken(user._id, JWT_SECRET, TOKEN_EXPIRY);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      ownerId: user.ownerId,
      firstLogin: user.firstLogin,
      imageUrl: user.imageUrl,
    },
  };
};

export const forgotPasswordService = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error(ERRORS.USER_NOT_FOUND);

  const token = generateToken(user._id, RESET_PASSWORD_SECRET, RESET_EXPIRY);
  const resetLink = `${APP_DOMAIN}/deeplink?to=update-password&token=${token}`;

  const html = renderTemplate(
    "resetPasswordEmail",
    { name: user.name || "Utilisateur", email, resetLink },
    "html"
  );
  const text = renderTemplate(
    "resetPasswordEmail",
    { name: user.name || "Utilisateur", email, resetLink },
    "txt"
  );

  await transporter.sendMail({
    from: BREVO_EMAIL_SENDER,
    to: email,
    subject: SUCCESS.RESET_EMAIL_SUBJECT,
    html,
    text,
  });

  return { message: SUCCESS.RESET_EMAIL_SENT };
};

export const generateApiKeyService = async () => {
  const apiKey = crypto.randomBytes(64).toString("hex");
  const refreshKey = crypto.randomBytes(64).toString("hex");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newKey = new ApiKey({ key: apiKey, refreshKey, expiresAt });
  await newKey.save();

  return { apiKey, refreshKey, expiresAt };
};

export const refreshApiKeyService = async (refreshKey: string) => {
  const record = await ApiKey.findOne({ refreshKey });
  if (!record) throw new Error("refreshKey invalide");

  record.key = crypto.randomBytes(64).toString("hex");
  record.refreshKey = crypto.randomBytes(64).toString("hex");
  record.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await record.save();

  return {
    apiKey: record.key,
    refreshKey: record.refreshKey,
    expiresAt: record.expiresAt,
  };
};
