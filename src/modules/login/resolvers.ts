import { ResolverMap } from "../../types/graphql-utils";
import { User } from "../../entity/User";
import * as bcrypt from "bcryptjs";
import {
  emailErrorResponse,
  accountLockedResponse,
  errorResponse
} from "./responses";
import { userSessionIdPrefix } from "../../utils/constants";

export const resolvers: ResolverMap = {
  Query: {
    bye2: () => "Bye"
  },
  Mutation: {
    login: async (
      _,
      { email, password }: GQL.ILoginOnMutationArguments,
      { session, redis, req }
    ) => {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return errorResponse;
      }

      if (!user.confirmed) {
        return emailErrorResponse;
      }

      if (user.forgotPasswordLocked) {
        return accountLockedResponse;
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return errorResponse;
      }

      // login successful
      session.userId = user.id;
      if (req.sessionID) {
        await redis.lpush(`${userSessionIdPrefix}${user.id}`, req.sessionID);
      }

      return null;
    }
  }
};
