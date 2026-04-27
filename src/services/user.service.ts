// services/user.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import streamifier from "streamifier";
import mongoose from "mongoose";

import User, { IUser } from "../models/user.model";
import UserType from "../models/userType.model";
import PackAccess from "../models/packAccess.model";
import cloudinary from "../core/config/cloudinary";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

import { AppError } from "../core/errors/AppError";

import {
  ERRORS,
  SUCCESS
} from "../core/utils/messages.util";
import { USER_ERRORS } from "../modules/user/user.errors";

export class UserService {
// Helper to upload a buffer to Cloudinary
  static uploadFromBuffer(fileBuffer: Buffer): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "user_images" },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("Unknown Cloudinary upload error"));
          }
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(stream);
    });
  }

  static async findUserOrFail(id: string) {
    const user = await User.findById(id);
    if (!user) throw new Error(ERRORS.USER_NOT_FOUND);
    return user;
  }

  static async uploadImageFile(id: string, fileBuffer: Buffer) {
    const user = await this.findUserOrFail(id);

    if (user.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.imagePublicId);
      } catch (err: any) {
        console.warn("Impossible de supprimer l'ancienne image :", err.message);
      }
    }

    const result = await this.uploadFromBuffer(fileBuffer);

    user.imageUrl = result.secure_url;
    user.imagePublicId = result.public_id;

    await user.save();

    return {
      message: SUCCESS.IMAGE_UPDATED,
      imageUrl: result.secure_url,
    };
  }

  static async addUserType(type_id: number, name: string) {
    if (!type_id || !name) throw new Error(ERRORS.USER_TYPE_REQUIRED);
    const userType = await UserType.create({ type_id, name });
    return { message: SUCCESS.USER_TYPE_CREATED, userType };
  }

  static async addDeviceToken(userId: string, deviceToken: string) {
    if (!userId || !deviceToken) throw new Error(ERRORS.DEVICE_TOKEN_REQUIRED);
    const user = await this.findUserOrFail(userId);
    if (!user.devicesToken.includes(deviceToken)) {
      user.devicesToken.push(deviceToken);
      await user.save();
    }
    return { message: SUCCESS.TOKEN_ADDED, devicesToken: user.devicesToken };
  }

  static async findAllUsers() {
    const users = await User.find().select('-password -firstLogin -devicesToken -imagePublicId');
    return { message: SUCCESS.USERS_FETCHED, users };
  }

  static async findAllByOwner(ownerId: string) {
    const users = await User.find({
      $or: [
        { _id: ownerId },
        { ownerId },
      ]
    }).lean();

    const userIds = users.map(u => u._id);

    const allPackAccess = await PackAccess.find({ userId: { $in: userIds } })
      .populate("packId")
      .lean();

    const accessByUserId = allPackAccess.reduce<Record<string, any[]>>((acc, pa) => {
      const uid = pa.userId.toString();
      if (!acc[uid]) acc[uid] = [];
      const { packId, ...rest } = pa;
      acc[uid].push({ ...rest, pack: packId });
      return acc;
    }, {});

    const enrichedUsers = users.map(u => ({
      ...u,
      packAccessList: accessByUserId[u._id.toString()] || [],
    }));

    return enrichedUsers;
  }

  static async updateUserById(id: string, updateFields: Partial<IUser>) {
    const user = await this.findUserOrFail(id);
    Object.assign(user, updateFields);
    await user.save();
    return { message: SUCCESS.USER_UPDATED, userId: user._id };
  }

  static async resetPassword(token: string, newPassword: string) {
    if (!token) throw new Error(ERRORS.TOKEN_MISSING);

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "RANDOM_TOKEN_SECRET");
    if (!newPassword) throw new Error(ERRORS.PASSWORD_REQUIRED);

    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(decoded.userId, { password: hash });

    return { message: SUCCESS.PASSWORD_UPDATED };
  }

  static async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(USER_ERRORS.USER_NOT_FOUND);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new AppError(USER_ERRORS.OLD_PASSWORD_INCORRECT);

    user.password = await bcrypt.hash(newPassword, 10);
    user.firstLogin = false;
    await user.save();

    return { message: SUCCESS.PASSWORD_UPDATED };
  }

  static async deleteDeviceToken(userId: string, deviceToken: string) {
    if (!userId || !deviceToken) throw new Error(ERRORS.DEVICE_TOKEN_REQUIRED);
    const user = await this.findUserOrFail(userId);
    const initialLength = user.devicesToken.length;
    user.devicesToken = user.devicesToken.filter(t => t !== deviceToken);

    if (user.devicesToken.length === initialLength) throw new Error(ERRORS.DEVICE_TOKEN_NOT_FOUND);

    await user.save();
    return { message: SUCCESS.TOKEN_DELETED, devicesToken: user.devicesToken };
  }

  static async deleteUserById(id: string) {
    await this.findUserOrFail(id);
    await PackAccess.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);
    return { message: SUCCESS.USER_DELETED };
  }

  static async getUserIdByEmail(email: string) {
    if (!email) throw new Error("Email manquant");
    const user = await User.findOne({ email }).select("_id");
    if (!user) throw new Error("Utilisateur introuvable");
    return user._id;
  }

  static async findAllOwners() {
    const children = await User.find().select("ownerId").lean();
    const childrenOwnerIds = new Set(
      children.filter(u => u.ownerId).map(u => u.ownerId!.toString())
    );

    const owners = await User.find({
      $or: [
        { _id: { $in: Array.from(childrenOwnerIds) } },
        { ownerId: null }
      ]
    })
      .select("-password -firstLogin -devicesToken -imagePublicId -ownerId")
      .lean();

    return { message: SUCCESS.OWNERS_FETCHED, owners };
  }
}
