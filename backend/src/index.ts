import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectDB } from "./config/db";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { buildContext, Context } from "./auth/context";

const start = async () => {
  await connectDB();

  const server = new ApolloServer<Context>({ typeDefs, resolvers });
  const PORT = Number(process.env.PORT) || 4000;

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: buildContext,
  });

  console.log(`🚀 DevBoard API ready at ${url}`);
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
