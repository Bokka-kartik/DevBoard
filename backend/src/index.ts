import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { connectDB } from "./config/db";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { getUserFromToken, Context } from "./auth/context";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";

const start = async () => {
  await connectDB();

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const app = express();
  const httpServer = http.createServer(app);

  // WebSocket server for GraphQL subscriptions.
  const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
  const wsCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const auth = (ctx.connectionParams?.authorization as string) || null;
        return { user: await getUserFromToken(auth) };
      },
    },
    wsServer
  );

  const server = new ApolloServer<Context>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.get("/", (_req, res) => res.send("DevBoard API is running"));
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    apiLimiter,
    expressMiddleware(server, {
      context: async ({ req }) => ({ user: await getUserFromToken(req.headers.authorization) }),
    })
  );

  const PORT = Number(process.env.PORT) || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 DevBoard API ready at http://localhost:${PORT}/graphql`);
    console.log(`🔌 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
