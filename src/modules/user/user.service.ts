import bcrypt from "bcrypt";
import streamifier from "streamifier";

import User, { IUser } from "./user.model";
import UserType from "./userType.model";
import PackAccess from "../pack/packAccess.model";
import cloudinary from "../../core/config/cloudinary";

import { AppError } from "../../core/errors/AppError";
import { USER_ERRORS } from "./user.errors";
import { SUCCESS } from "../../core/utils/messages.util";

import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

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

  static async findAllByOwner(ownerId: string) {
    const users = await User.find({
      $or: [{ _id: ownerId }, { ownerId }],
    }).lean();

    const userIds = users.map((u) => u._id);

    const allPackAccess = await PackAccess.find({
      userId: { $in: userIds },
    })
      .populate("packId")
      .lean();

    const accessByUserId = allPackAccess.reduce<Record<string, any[]>>(
      (acc, pa) => {
        const uid = pa.userId.toString();

        if (!acc[uid]) acc[uid] = [];

        const { packId, ...rest } = pa;

        acc[uid].push({ ...rest, pack: packId });

        return acc;
      },
      {}
    );

    return users.map((u) => ({
      ...u,
      packAccessList: accessByUserId[u._id.toString()] || [],
    }));
  }

  static async updateUserById(id: string, updateFields: Partial<IUser>) {
    const user = await this.findUserOrFail(id);

    Object.assign(user, updateFields);
    await user.save();

    return {
      message: SUCCESS.USER_UPDATED,
      userId: user._id,
    };
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

  static async createPassword(userId: string,newPassword: string) {
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

    await PackAccess.deleteMany({ userId: id });
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