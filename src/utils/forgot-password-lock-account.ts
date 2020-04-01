import { Redis } from "ioredis";
import { removeAllUserSessions } from "./remove-all-user-sessions";
import { User } from "../entity/User";

export const forgotPasswordLockAccount = async (
  userId: string,
  redis: Redis
) => {
  // cannot login
  await User.update({ id: userId }, { forgotPasswordLocked: true });
  // remove all sessions
  await removeAllUserSessions(userId, redis);
};
