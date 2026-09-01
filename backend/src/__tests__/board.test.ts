import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { connectTestDB, closeTestDB, clearTestDB } from "./helpers/testDb";
import { buildTestApp } from "./helpers/testApp";
import { users, boards } from "./fixtures/data";
import { REGISTER, CREATE_BOARD, MY_BOARDS, BOARD } from "./fixtures/operations";

let request: Awaited<ReturnType<typeof buildTestApp>>;
let tokenAlice: string;
let tokenBob: string;

beforeAll(async () => {
  await connectTestDB();
  request = await buildTestApp();
});

beforeEach(async () => {
  await clearTestDB();
  const a = await request.post("/graphql").send({ query: REGISTER, variables: users.alice });
  const b = await request.post("/graphql").send({ query: REGISTER, variables: users.bob });
  tokenAlice = a.body.data.register.token;
  tokenBob   = b.body.data.register.token;
});

afterAll(closeTestDB);

const createBoard = (token: string, name = boards.main.name) =>
  request.post("/graphql").set("authorization", `Bearer ${token}`).send({
    query: CREATE_BOARD, variables: { name },
  });

describe("createBoard", () => {
  it("seeds 3 default columns in correct order", async () => {
    const res = await createBoard(tokenAlice);
    const { id } = res.body.data.createBoard;

    const detail = await request
      .post("/graphql").set("authorization", `Bearer ${tokenAlice}`)
      .send({ query: BOARD, variables: { id } });

    const cols = detail.body.data.board.columns;
    expect(cols).toHaveLength(3);
    expect(cols.map((c: { title: string }) => c.title)).toEqual(["To Do", "In Progress", "Done"]);
    expect(cols[0].order).toBe(0);
  });

  it("rejects a whitespace-only name", async () => {
    const res = await createBoard(tokenAlice, boards.invalid.name);
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("rejects a name longer than 100 characters", async () => {
    const res = await createBoard(tokenAlice, boards.tooLong.name);
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("blocks unauthenticated access", async () => {
    const res = await request.post("/graphql").send({ query: CREATE_BOARD, variables: { name: "Sneaky" } });
    expect(res.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });
});

describe("myBoards", () => {
  it("returns only boards owned by the requesting user", async () => {
    await createBoard(tokenAlice, "Alice Board");
    await createBoard(tokenBob, "Bob Board");

    const res = await request
      .post("/graphql").set("authorization", `Bearer ${tokenAlice}`)
      .send({ query: MY_BOARDS });

    const names = res.body.data.myBoards.map((b: { name: string }) => b.name);
    expect(names).toContain("Alice Board");
    expect(names).not.toContain("Bob Board");
  });

  it("returns an empty array when the user has no boards", async () => {
    const res = await request
      .post("/graphql").set("authorization", `Bearer ${tokenAlice}`)
      .send({ query: MY_BOARDS });
    expect(res.body.data.myBoards).toHaveLength(0);
  });
});

describe("board access control", () => {
  it("blocks a non-member from reading another user's board", async () => {
    const created = await createBoard(tokenAlice);
    const boardId = created.body.data.createBoard.id;

    const res = await request
      .post("/graphql").set("authorization", `Bearer ${tokenBob}`)
      .send({ query: BOARD, variables: { id: boardId } });

    expect(res.body.errors[0].extensions.code).toBe("FORBIDDEN");
  });
});

const CREATE_BOARD = `
  mutation CreateBoard($name: String!) {
    createBoard(name: $name) { id name }
  }
`;

const MY_BOARDS = `
  query { myBoards { id name } }
`;

const BOARD = `
  query Board($id: ID!) {
    board(id: $id) {
      id name
      columns { id title order cards { id title } }
    }
  }
`;

let request: Awaited<ReturnType<typeof buildTestApp>>;
let token: string;

beforeAll(async () => {
  await connectTestDB();
  request = await buildTestApp();
});

beforeEach(async () => {
  await clearTestDB();
  const res = await request.post("/graphql").send({
    query: REGISTER,
    variables: { username: "kartik", email: "kartik@test.com", password: "password123" },
  });
  token = res.body.data.register.token;
});

afterAll(closeTestDB);

describe("createBoard", () => {
  it("creates a board with three default columns", async () => {
    const res = await request
      .post("/graphql")
      .set("authorization", `Bearer ${token}`)
      .send({ query: CREATE_BOARD, variables: { name: "My Board" } });

    const board = res.body.data.createBoard;
    expect(board.name).toBe("My Board");

    const detail = await request
      .post("/graphql")
      .set("authorization", `Bearer ${token}`)
      .send({ query: BOARD, variables: { id: board.id } });

    const cols = detail.body.data.board.columns;
    expect(cols).toHaveLength(3);
    expect(cols.map((c: { title: string }) => c.title)).toEqual(["To Do", "In Progress", "Done"]);
  });

  it("rejects an empty board name", async () => {
    const res = await request
      .post("/graphql")
      .set("authorization", `Bearer ${token}`)
      .send({ query: CREATE_BOARD, variables: { name: "   " } });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("blocks unauthenticated access", async () => {
    const res = await request
      .post("/graphql")
      .send({ query: CREATE_BOARD, variables: { name: "Sneaky" } });
    expect(res.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });
});

describe("myBoards", () => {
  it("returns only boards owned by / shared with the user", async () => {
    await request
      .post("/graphql")
      .set("authorization", `Bearer ${token}`)
      .send({ query: CREATE_BOARD, variables: { name: "Board A" } });

    const res = await request
      .post("/graphql")
      .set("authorization", `Bearer ${token}`)
      .send({ query: MY_BOARDS });

    expect(res.body.data.myBoards).toHaveLength(1);
    expect(res.body.data.myBoards[0].name).toBe("Board A");
  });
});
