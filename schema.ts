export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type Member {
    user: User!
    role: String!
  }

  type Board {
    id: ID!
    name: String!
    owner: User!
    members: [Member!]!
    columns: [Column!]!
    createdAt: String
  }

  type Column {
    id: ID!
    board: ID!
    title: String!
    order: Int!
    cards: [Card!]!
  }

  type Card {
    id: ID!
    board: ID!
    column: ID!
    title: String!
    description: String
    assignee: User
    dueDate: String
    labels: [String!]!
    order: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    myBoards: [Board!]!
    board(id: ID!): Board
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(usernameOrEmail: String!, password: String!): AuthPayload!

    createBoard(name: String!): Board!
    renameBoard(id: ID!, name: String!): Board!
    deleteBoard(id: ID!): Boolean!
    addMember(boardId: ID!, usernameOrEmail: String!): Board!

    createColumn(boardId: ID!, title: String!): Column!
    renameColumn(id: ID!, title: String!): Column!
    deleteColumn(id: ID!): Boolean!

    createCard(columnId: ID!, title: String!, description: String): Card!
    updateCard(id: ID!, title: String, description: String, assigneeId: ID, dueDate: String, labels: [String!]): Card!
    deleteCard(id: ID!): Boolean!
    moveCard(id: ID!, toColumnId: ID!, toOrder: Int!): Card!
  }

  type Subscription {
    boardUpdated(boardId: ID!): Board!
  }
`;
