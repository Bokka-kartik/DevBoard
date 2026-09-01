// GraphQL operation strings shared across test suites.

export const REGISTER = `
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user { id username email }
    }
  }
`;

export const LOGIN = `
  mutation Login($usernameOrEmail: String!, $password: String!) {
    login(usernameOrEmail: $usernameOrEmail, password: $password) {
      token
      user { id username email }
    }
  }
`;

export const CREATE_BOARD = `
  mutation CreateBoard($name: String!) {
    createBoard(name: $name) { id name }
  }
`;

export const MY_BOARDS = `query { myBoards { id name } }`;

export const BOARD = `
  query Board($id: ID!) {
    board(id: $id) {
      id name
      columns { id title order cards { id title order } }
    }
  }
`;

export const CREATE_COLUMN = `
  mutation CreateColumn($boardId: ID!, $title: String!) {
    createColumn(boardId: $boardId, title: $title) { id title order }
  }
`;

export const CREATE_CARD = `
  mutation CreateCard($columnId: ID!, $title: String!, $description: String) {
    createCard(columnId: $columnId, title: $title, description: $description) {
      id title description order
    }
  }
`;

export const UPDATE_CARD = `
  mutation UpdateCard($id: ID!, $title: String, $description: String, $labels: [String!]) {
    updateCard(id: $id, title: $title, description: $description, labels: $labels) {
      id title description labels
    }
  }
`;

export const MOVE_CARD = `
  mutation MoveCard($id: ID!, $toColumnId: ID!, $toOrder: Int!) {
    moveCard(id: $id, toColumnId: $toColumnId, toOrder: $toOrder) {
      id column order
    }
  }
`;

export const DELETE_CARD = `
  mutation DeleteCard($id: ID!) { deleteCard(id: $id) }
`;
