import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($usernameOrEmail: String!, $password: String!) {
    login(usernameOrEmail: $usernameOrEmail, password: $password) {
      token
      user { id username email }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user { id username email }
    }
  }
`;

export const ME = gql`
  query Me {
    me { id username email }
  }
`;

export const MY_BOARDS = gql`
  query MyBoards {
    myBoards { id name createdAt }
  }
`;

export const BOARD = gql`
  query Board($id: ID!) {
    board(id: $id) {
      id
      name
      members { role user { id username } }
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
          labels
          dueDate
          assignee { id username }
        }
      }
    }
  }
`;

export const CREATE_BOARD = gql`
  mutation CreateBoard($name: String!) {
    createBoard(name: $name) { id name }
  }
`;

export const DELETE_BOARD = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;

export const CREATE_COLUMN = gql`
  mutation CreateColumn($boardId: ID!, $title: String!) {
    createColumn(boardId: $boardId, title: $title) { id title order }
  }
`;

export const CREATE_CARD = gql`
  mutation CreateCard($columnId: ID!, $title: String!) {
    createCard(columnId: $columnId, title: $title) { id title order column }
  }
`;

export const UPDATE_CARD = gql`
  mutation UpdateCard(
    $id: ID!
    $title: String
    $description: String
    $assigneeId: ID
    $dueDate: String
    $labels: [String!]
  ) {
    updateCard(
      id: $id
      title: $title
      description: $description
      assigneeId: $assigneeId
      dueDate: $dueDate
      labels: $labels
    ) {
      id
      title
      description
      dueDate
      labels
      assignee { id username }
    }
  }
`;

export const DELETE_CARD = gql`
  mutation DeleteCard($id: ID!) {
    deleteCard(id: $id)
  }
`;

export const MOVE_CARD = gql`
  mutation MoveCard($id: ID!, $toColumnId: ID!, $toOrder: Int!) {
    moveCard(id: $id, toColumnId: $toColumnId, toOrder: $toOrder) {
      id column order
    }
  }
`;

export const BOARD_UPDATED = gql`
  subscription BoardUpdated($boardId: ID!) {
    boardUpdated(boardId: $boardId) {
      id
      name
      members { role user { id username } }
      columns {
        id
        title
        order
        cards {
          id
          title
          description
          order
          labels
          dueDate
          assignee { id username }
        }
      }
    }
  }
`;
