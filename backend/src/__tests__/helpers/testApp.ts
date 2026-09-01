import http from "http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import supertest from "supertest";
import { typeDefs } from "../../graphql/schema";
import { resolvers } from "../../graphql/resolvers";
import { getUserFromToken, Context } from "../../auth/context";

export const buildTestApp = async () => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const server = new ApolloServer<Context>({ schema });
  await server.start();

  const app = express();
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ user: await getUserFromToken(req.headers.authorization) }),
    })
  );

  const httpServer = http.createServer(app);
  return supertest(httpServer);
};

export const gql = (query: string, variables = {}, token?: string) => ({
  query,
  variables,
  ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
});
