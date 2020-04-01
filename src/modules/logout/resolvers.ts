import { ResolverMap } from "../../types/graphql-utils";
import { removeAllUserSessions } from "../../utils/remove-all-user-sessions";

export const resolvers: ResolverMap = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;
      if (userId) {
        await removeAllUserSessions(userId, redis);
        return true;
      }
      return false;
    }
  }
};
