import { GraphQLServer } from "graphql-yoga";

import { redis } from "./redis";

import { createTypeormConn } from "./utils/create-typeorm-conn";
import { confirmEmail } from "./routes/confirmed-email";
import { genSchema } from "./utils/generate-schema";

export const startServer = async (): Promise<any> => {
  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({ request }) => ({
      redis,
      url: request.protocol + "://" + request.get("host")
    })
  });

  server.express.get("/confirm/:id", confirmEmail);

  // Database Connection
  await createTypeormConn();
  // Start The Server
  const app = await server.start({
    port: process.env.NODE_ENV === "test" ? 0 : 4000
  });

  console.log("Server is running on localhost:4000");
  return app;
};
