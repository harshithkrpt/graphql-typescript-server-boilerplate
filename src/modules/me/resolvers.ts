import { ResolverMap } from "../../types/graphql-utils";
import { User } from "../../entity/User";
import { createMiddleware } from "../../utils/create-middleware";
import middleware from "./middleware";

export const resolvers: ResolverMap = {
  Query: {
    me: createMiddleware(middleware, (_, __, { session }) =>
      User.findOne({ where: { id: session.userId } })
    )
  }
};
