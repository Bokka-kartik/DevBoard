import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { connectTestDB, closeTestDB, clearTestDB } from "./helpers/testDb";
import { buildTestApp } from "./helpers/testApp";
import { users, boards, columns } from "./fixtures/data";
import { REGISTER, CREATE_BOARD, BOARD, CREATE_COLUMN } from "./fixtures/operations";

let request: Awaited<ReturnType<typeof buildTestApp>>;
let token: string;
let boardId: string;

beforeAll(async () => {
  await connectTestDB();
  request = await buildTestApp();
});

beforeEach(async () => {
  await clearTestDB();
  const reg = await request.post("/graphql").send({ query: REGISTER, variables: users.alice });
  token = reg.body.data.register.token;

  const b = await request
    .post("/graphql").set("authorization", `Bearer ${token}`)
    .send({ query: CREATE_BOARD, variables: { name: boards.main.name } });
  boardId = b.body.data.createBoard.id;
});

afterAll(closeTestDB);

const createColumn = (title: string) =>
  request.post("/graphql").set("authorization", `Bearer ${token}`).send({
    query: CREATE_COLUMN, variables: { boardId, title },
  });

const getColumns = async () => {
  const res = await request
    .post("/graphql").set("authorization", `Bearer ${token}`)
    .send({ query: BOARD, variables: { id: boardId } });
  return res.body.data.board.columns as { id: string; title: string; order: number }[];
};

describe("createColumn", () => {
  it("appends columns with incrementing order after the seeded defaults", async () => {
    await createColumn(columns.backlog.title);
    const cols = await getColumns();
    // 3 seeded + 1 new
    expect(cols).toHaveLength(4);
    expect(cols[3].title).toBe(columns.backlog.title);
    expect(cols[3].order).toBe(3);
  });

  it("rejects an empty title", async () => {
    const res = await createColumn(columns.invalid.title);
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("blocks a non-member from adding a column", async () => {
    const bobReg = await request.post("/graphql").send({ query: REGISTER, variables: users.bob });
    const bobToken = bobReg.body.data.register.token;

    const res = await request
      .post("/graphql").set("authorization", `Bearer ${bobToken}`)
      .send({ query: CREATE_COLUMN, variables: { boardId, title: "Sneaky" } });

    expect(res.body.errors[0].extensions.code).toBe("FORBIDDEN");
  });
});
