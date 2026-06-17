 import User from "../user/user.model";;
 import { AppError } from "../../core/errors/app.error";
 import { USER_ERRORS } from "../user/user.errors";

export async function getActivityActor(actorId: string) {
  const actor = await User.findById(actorId)
    .select("name");

  if (!actor) {
    throw new AppError(USER_ERRORS.USER_NOT_FOUND);
  }

  return {
    _id: actor._id.toString(),
    name: actor.name,
  };
}