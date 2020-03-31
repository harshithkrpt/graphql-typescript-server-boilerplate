import { ResolverMap } from "../../types/graphql-utils";
import * as bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import * as yup from "yup";
import { formatYupError } from "../../utils/format-yup-error";
import {
  duplicateEmail,
  invalidEmail,
  passwordNotLongEnough,
  emailNotLongEnough
} from "./error-messages";
import { createConfirmEmailLink } from "../../utils/create-confirm-email-link";

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3, emailNotLongEnough)
    .max(255)
    .email(invalidEmail),
  password: yup
    .string()
    .min(3, passwordNotLongEnough)
    .max(255)
});

export const resolvers: ResolverMap = {
  Query: {
    bye: () => "Bye"
  },
  Mutation: {
    register: async (
      _,
      args: GQL.IRegisterOnMutationArguments,
      { redis, url }
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
      const hashedPassword = await bcrypt.hash(password, 10);
      let user = User.create({
        email,
        password: hashedPassword
      });
      user = await user.save();

      await createConfirmEmailLink(url, user.id, redis);

      return null;
    }
  }
};
