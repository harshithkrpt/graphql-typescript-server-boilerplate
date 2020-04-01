import "reflect-metadata";
import "dotenv/config";
import { GraphQLServer } from "graphql-yoga";
import * as session from "express-session";
import * as connectRedis from "connect-redis";
import * as RateLimit from "express-rate-limit";
import * as RateLimitRedisStore from "rate-limit-redis";
import * as passport from "passport";
import { Strategy } from "passport-twitter";

import { redis } from "./redis";
import { createTypeormConn } from "./utils/create-typeorm-conn";
import { confirmEmail } from "./routes/confirmed-email";
import { genSchema } from "./utils/generate-schema";
import { redisSessionPrefix } from "./utils/constants";
import { User } from "./entity/User";

const RedisStore = connectRedis(session);

export const startServer = async () => {
  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({ request }) => ({
      redis,
      url: request.protocol + "://" + request.get("host"),
      session: request.session,
      req: request
    })
  });

  server.express.use(
    new RateLimit({
      store: new RateLimitRedisStore({
        client: redis
      }),
      windowMs: 15 * 60 * 1000,
      max: 100,
      delayMs: 0
    })
  );

  server.express.use(
    session({
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix
      }),
      name: "qid",
      secret: "hdoihdiso",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    })
  );

  const cors = {
    credentials: true,
    origin:
      process.env.NODE_ENV === "test"
        ? "*"
        : (process.env.FRONTEND_HOST as string)
  };

  server.express.get("/confirm/:id", confirmEmail);

  const connection = await createTypeormConn();

  passport.use(
    new Strategy(
      {
        consumerKey: process.env.TWITTER_CONSUME as string,
        consumerSecret: process.env.TWITTER_CONSUME_SECRET as string,
        callbackURL: "http://localhost:4000/auth/twitter/callback",
        includeEmail: true
      },
      async (_, __, profile, cb) => {
        const { id, emails } = profile;

        const query = connection
          .getRepository(User)
          .createQueryBuilder("user")
          .where("user.twitterId = :id", { id });

        let email: string | null = null;
        if (emails) {
          email = emails[0].value;
          query.orWhere("user.email = :email", { email });
        }
        let user = await query.getOne();

        if (!user) {
          // register
          user = await User.create({
            twitterId: id,
            email
          }).save();
        } else if (!user.twitterId) {
          // merge account
          // we found user by email
          user.twitterId = id;
          await user.save();
        } else {
          // login
        }

        return cb(null, { id: user?.id });
      }
    )
  );

  server.express.use(passport.initialize());

  server.express.get("/auth/twitter", passport.authenticate("twitter"));

  server.express.get(
    "/auth/twitter/callback",
    passport.authenticate("twitter", { session: false }),
    (req, res) => {
      (req.session as any).userId = (req.user as any).id;
      // TODO redirect to frontend
      res.redirect("/");
    }
  );

  const app = await server.start({
    cors,
    port: process.env.NODE_ENV === "test" ? 0 : 4000
  });
  console.log("Server is running on localhost:4000");

  return app;
};
