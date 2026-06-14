import bcrypt from "bcrypt";
import streamifier from "streamifier";

import User, { IUser } from "./user.model";
import UserType from "./userType.model";
import DeviceAccess from "../device/deviceAccess.model";
import cloudinary from "../../core/config/cloudinary";

import { AppError } from "../../core/errors/app.error";
import { USER_ERRORS } from "./user.errors";
import { SUCCESS } from "../../core/utils/messages.util";

import mongoose from "mongoose";

import { AUTH_ERRORS } from "../auth/auth.errors";
import { CreateUserDto } from "./dto/user.dto";
import { USER_TYPE } from "./enums/userType.enum";

import { generateTempPassword } from "../../shared/utils/password.util";
import * as emailService from "../../infrastructure/email/email.service";
import { DeviceService } from "../device/device.service";
import { COMMON_ERRORS } from "../../core/errors/common.error";

export class UserService {
  // =============================
  // CLOUDINARY
  // =============================
  static uploadFromBuffer(fileBuffer: Buffer) {
    return new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "user_images" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(stream);
    });
  }

  // =============================
  // HELPERS
  // =============================
  static async findUserOrFail(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(USER_ERRORS.INVALID_USER_ID);
    }

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    return user;
  }

  // =============================
  // SERVICES
  // =============================

  static async getMe(userId: string) {
    const user = await User.findById(userId).select("-password -imagePublicId");

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    return user;
  }

  static async createUser(data: CreateUserDto) {
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) throw new AppError(AUTH_ERRORS.USER_EXISTS);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    if (data.ownerId) {
      if (!mongoose.Types.ObjectId.isValid(data.ownerId)) {
        throw new AppError(AUTH_ERRORS.INVALID_OWNER_ID);
      }

      const ownerUser = await User.findById(data.ownerId);
      if (!ownerUser) throw new AppError(AUTH_ERRORS.OWNER_NOT_FOUND);
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phoneNumber: data.phoneNumber || null,
      userType: data.userType,
      ownerId: data.ownerId || null,
    });

    return user;
  }

  static async addMember(data: CreateUserDto) {
    const tempPassword = generateTempPassword();

    const user = await UserService.createUser({
      ...data,
      password: tempPassword,
      userType: USER_TYPE.MEMBER,
    });

    await DeviceService.addOrUpdateMultipleAccess(user._id, data.accessList);

    await emailService.sendWelcomeEmail(
      user.name,
      user.email,
      tempPassword
    );

    return {
      message: SUCCESS.MEMBER_CREATED,
    };
  }

  static async updateMember(userId: string, fields: Partial<IUser>, accessList: any[]) {
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $set: fields },
      { new: true }
    );

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    if(accessList && accessList.length > 0) {
      await DeviceService.addOrUpdateMultipleAccess(userId, accessList);
    }
    console.log("Updated user:", user);

    return user;
  }

  static async uploadImageFile(id: string, fileBuffer: Buffer) {
    const user = await this.findUserOrFail(id);

    if (user.imagePublicId) {
      await cloudinary.uploader.destroy(user.imagePublicId);
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

  static async findAllUsers() {
    const users = await User.find().select("-password -firstLogin -devicesToken -imagePublicId");

    return {
      message: SUCCESS.USERS_FETCHED,
      users,
    };
  }

  static async findAllMembers(userId: string) {
    const user = await User.findById(userId)
      .select("_id ownerId")
      .lean();

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    const ownerId = user.ownerId ?? user._id.toString();

    return User.find({
      $or: [
        { _id: ownerId },
        { ownerId },
      ],
    }).lean();
  }

  static async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      throw new AppError(USER_ERRORS.OLD_PASSWORD_INCORRECT);
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return { message: SUCCESS.PASSWORD_UPDATED };
  }

  static async createPassword(userId: string, newPassword: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.firstLogin = false;

    await user.save();

    return { message: SUCCESS.PASSWORD_UPDATED };
  }

  static async deleteUserById(id: string) {
    await this.findUserOrFail(id);

    await DeviceAccess.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    return { message: SUCCESS.USER_DELETED };
  }

  static async getUserIdByEmail(email: string) {
    if (!email) {
      throw new AppError(USER_ERRORS.EMAIL_REQUIRED);
    }

    const user = await User.findOne({ email }).select("_id");

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    return user._id;
  }

  static async findAllOwners() {
    const children = await User.find().select("ownerId").lean();

    const ownerIds = new Set(
      children.filter((u) => u.ownerId).map((u) => u.ownerId!.toString())
    );

    const owners = await User.find({
      $or: [{ _id: { $in: Array.from(ownerIds) } }, { ownerId: null }],
    })
      .select("-password -firstLogin -devicesToken -imagePublicId -ownerId")
      .lean();

    return {
      message: SUCCESS.OWNERS_FETCHED,
      owners,
    };
  }

  static async addUserType(type_id: number, name: string) {
    if (!type_id || !name) {
      throw new AppError(USER_ERRORS.USER_TYPE_REQUIRED);
    }

    const userType = await UserType.create({ type_id, name });

    return {
      message: SUCCESS.USER_TYPE_CREATED,
      userType,
    };
  }

  static async addDeviceToken(userId: string, deviceToken: string) {
    await User.updateOne(
      { _id: userId },
      { $addToSet: { devicesToken: deviceToken } }
    );

    return {
      message: SUCCESS.TOKEN_ADDED,
    };
  }

  static async deleteDeviceToken(userId: string, deviceToken: string) {
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { devicesToken: deviceToken } }
    );

    if (result.modifiedCount === 0) {
      throw new AppError(USER_ERRORS.DEVICE_TOKEN_NOT_FOUND);
    }

    return { message: SUCCESS.TOKEN_DELETED };
  }
}