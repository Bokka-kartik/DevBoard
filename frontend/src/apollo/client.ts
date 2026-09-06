import { ApolloClient, InMemoryCache, createHttpLink, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";
const httpLink = createHttpLink({
  uri: apiUrl,
});

const wsUrl = import.meta.env.VITE_WS_URL || apiUrl.replace(/^http/, "ws");
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem("token");
      return { authorization: token ? `Bearer ${token}` : "" };
    },
  })
);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const client = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    authLink.concat(httpLink)
  ),
  cache: new InMemoryCache(),
});
