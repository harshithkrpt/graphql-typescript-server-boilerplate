import { ResolverMap } from "../../types/graphql-utils";
import * as yup from "yup";
import { forgotPasswordLockAccount } from "../../utils/forgot-password-lock-account";
import { createForgotPasswordLink } from "../../utils/create-forgot-password-link";
import { User } from "../../entity/User";
import { userNotFoundEmail, expiredKeyError } from "./error-messages";
import { forgotPasswordPrefix } from "../../utils/constants";
import { registerPasswordValidation } from "../../utils/yup-scheme";
import { formatYupError } from "../../utils/format-yup-error";
import * as bcrypt from "bcryptjs";

const schema = yup.object().shape({
  newPassword: registerPasswordValidation
});

export const resolvers: ResolverMap = {
  Query: {
    dummy2: () => "Bye"
  },
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      { redis }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return [
          {
            path: "email",
            message: userNotFoundEmail
          }
        ];
      }
      await forgotPasswordLockAccount(user.id, redis);
      // TODO ADD FRONT_END_URL_SEND_EMAIL_WITH_URL
      await createForgotPasswordLink("", user.id, redis);
      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;

      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: "key",
            message: expiredKeyError
          }
        ];
      }

      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (e) {
        return formatYupError(e);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatePromise = User.update(
        { id: userId },
        {
          forgotPasswordLocked: false,
          password: hashedPassword
        }
      );

      const deleteKeyPromise = redis.del(redisKey);

      await Promise.all([updatePromise, deleteKeyPromise]);
      return null;
    }
  }
};
