import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt, { JsonWebTokenError, SignOptions, TokenExpiredError } from "jsonwebtoken";
import mongoose from "mongoose";

import dotenv from "dotenv";

import User from "../user/user.model";

import { SUCCESS } from "../../core/utils/messages.util";
import { AppError } from "../../core/errors/app.error";

import { AUTH_ERRORS } from "./auth.errors";
import * as emailService from "../../infrastructure/email/email.service";
import { SignupDto } from "./dto/signup.dto";
import { USER_TYPE } from "../user/enums/userType.enum";
import { USER_ERRORS } from "../user/user.errors";

dotenv.config();

// =============================
// ENV & CONSTANTS
// =============================
const {
  JWT_SECRET = "",
  RESET_PASSWORD_SECRET = "",
} = process.env;

const ACCESS_TOKEN_EXPIRY = "24h";
const REFRESH_TOKEN_EXPIRY = "30d";
const RESET_EXPIRY = "1h";


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

// =============================
// SERVICES
// =============================
export const signupService = async (data: SignupDto) => {
  const { name, email, password, phoneNumber, userType, ownerId } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(AUTH_ERRORS.USER_EXISTS);
  }

  const tempPassword = password || generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  if ((userType === USER_TYPE.ADMIN || userType === USER_TYPE.MEMBER) && ownerId) {

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new AppError(AUTH_ERRORS.INVALID_OWNER_ID);
    }

    const ownerUser = await User.findById(ownerId);
    if (!ownerUser) {
      throw new AppError(AUTH_ERRORS.OWNER_NOT_FOUND);
    }
  }

  const user = new User({
    name,
    email,
    password: hashedPassword,
    phoneNumber: phoneNumber || null,
    userType,
    ownerId,
  });

  const savedUser = await user.save();
  await emailService.sendWelcomeEmail(name, email, tempPassword);

  return {
    message: SUCCESS.USER_CREATED,
    userId: savedUser._id,
  };
};

export const loginService = async (email: string, passwordInput: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS);

  const isValid = await bcrypt.compare(passwordInput, user.password);
  if (!isValid) throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS);

  const accessToken = generateToken(user._id, JWT_SECRET, ACCESS_TOKEN_EXPIRY);
  const refreshToken = generateToken(user._id, JWT_SECRET, REFRESH_TOKEN_EXPIRY);
  const { password, devicesToken, imagePublicId, ...safeUser } = user.toObject();

  return {
    accessToken,
    refreshToken,
    user: safeUser
  };
};

export const resetPasswordService = async (token: string, newPassword: string) =>{
  let decoded: any;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "RANDOM_TOKEN_SECRET"
    );
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AppError(USER_ERRORS.RESET_PASSWORD_TOKEN_EXPIRED);
    }

    if (err instanceof JsonWebTokenError) {
      throw new AppError(USER_ERRORS.RESET_PASSWORD_TOKEN_INVALID);
    }

    throw err;
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(decoded.userId, {
    password: hash,
  });

  return { message: SUCCESS.PASSWORD_UPDATED };
}

export const forgotPasswordService = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { message: SUCCESS.RESET_EMAIL_SENT }
  }

  const token = generateToken(user._id, RESET_PASSWORD_SECRET, RESET_EXPIRY);

  await emailService.sendResetPasswordEmail({
    to: email,
    name: user.name,
    token,
  });

  return { message: SUCCESS.RESET_EMAIL_SENT };
};

export const refreshTokenService = async (refreshToken: string) => {
  let decoded: any;

  try {
    decoded = jwt.verify(
      refreshToken,
      JWT_SECRET
    );
  } catch (err: any) {

    throw new AppError(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError(USER_ERRORS.USER_NOT_FOUND);
  }

  const newAccessToken = generateToken(
    user._id,
    JWT_SECRET,
    ACCESS_TOKEN_EXPIRY
  );

  const newRefreshToken = generateToken(
    user._id,
    JWT_SECRET,
    REFRESH_TOKEN_EXPIRY
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

