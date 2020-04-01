import { ResolverMap } from "../../types/graphql-utils";

import { User } from "../../entity/User";
import * as yup from "yup";
import { formatYupError } from "../../utils/format-yup-error";
import {
  duplicateEmail,
  invalidEmail,
  emailNotLongEnough
} from "./error-messages";
import { registerPasswordValidation } from "../../utils/yup-scheme";
// import { createConfirmEmailLink } from "../../utils/create-confirm-email-link";
// import { sendEmail } from "../../utils/send-email";

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3, emailNotLongEnough)
    .max(255)
    .email(invalidEmail),
  password: registerPasswordValidation
});

export const resolvers: ResolverMap = {
  Query: {
    bye: () => "Bye"
  },
  Mutation: {
    register: async (
      _,
      args: GQL.IRegisterOnMutationArguments
      // { redis, url }
    ) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (e) {
        return formatYupError(e);
      }
      const { email, password } = args;
      const userAlreadyExists = await User.findOne({
        where: { email },
        select: ["id"]
      });
      if (userAlreadyExists) {
        return [
          {
            path: "email",
            message: duplicateEmail
          }
        ];
      }

      const user = User.create({
        email,
        password
      });
      await user.save();

      // if (process.env.NODE_ENV !== "test") {
      //   await sendEmail(
      //     email,
      //     await createConfirmEmailLink(url, user.id, redis)
      //   );
      // }

      return null;
    }
  }
};
