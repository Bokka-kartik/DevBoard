import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { connectTestDB, closeTestDB, clearTestDB } from "./helpers/testDb";
import { buildTestApp } from "./helpers/testApp";
import { users, boards, cards } from "./fixtures/data";
import {
  REGISTER, CREATE_BOARD, BOARD,
  CREATE_CARD, UPDATE_CARD, DELETE_CARD, MOVE_CARD,
} from "./fixtures/operations";

let request: Awaited<ReturnType<typeof buildTestApp>>;
let token: string;
let boardId: string;
let columnIds: string[];

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

  const detail = await request
    .post("/graphql").set("authorization", `Bearer ${token}`)
    .send({ query: BOARD, variables: { id: boardId } });
  columnIds = detail.body.data.board.columns.map((c: { id: string }) => c.id);
});

afterAll(closeTestDB);

const createCard = (columnId: string, vars = cards.task1) =>
  request.post("/graphql").set("authorization", `Bearer ${token}`).send({
    query: CREATE_CARD,
    variables: { columnId, ...vars },
  });

const getBoardCards = async () => {
  const res = await request
    .post("/graphql").set("authorization", `Bearer ${token}`)
    .send({ query: BOARD, variables: { id: boardId } });
  return res.body.data.board.columns as { id: string; cards: { id: string; order: number }[] }[];
};

describe("createCard", () => {
  it("appends a card to the target column with correct order", async () => {
    await createCard(columnIds[0], cards.task1);
    await createCard(columnIds[0], cards.task2);

    const cols = await getBoardCards();
    const col0Cards = cols[0].cards;
    expect(col0Cards).toHaveLength(2);
    expect(col0Cards[0].order).toBe(0);
    expect(col0Cards[1].order).toBe(1);
  });

  it("rejects an empty title", async () => {
    const res = await createCard(columnIds[0], cards.invalid);
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("rejects a description longer than 2000 characters", async () => {
    const res = await createCard(columnIds[0], cards.longDesc);
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });
});

describe("updateCard", () => {
  it("updates title, description, and labels independently", async () => {
    const created = await createCard(columnIds[0]);
    const cardId = created.body.data.createCard.id;

    const res = await request
      .post("/graphql").set("authorization", `Bearer ${token}`)
      .send({
        query: UPDATE_CARD,
        variables: { id: cardId, title: "Updated", description: "New desc", labels: ["urgent"] },
      });

    expect(res.body.data.updateCard.title).toBe("Updated");
    expect(res.body.data.updateCard.description).toBe("New desc");
    expect(res.body.data.updateCard.labels).toEqual(["urgent"]);
  });
});

describe("moveCard", () => {
  it("moves a card to a different column and updates its order", async () => {
    const created = await createCard(columnIds[0]);
    const cardId = created.body.data.createCard.id;

    await request
      .post("/graphql").set("authorization", `Bearer ${token}`)
      .send({ query: MOVE_CARD, variables: { id: cardId, toColumnId: columnIds[1], toOrder: 0 } });

    const cols = await getBoardCards();
    expect(cols[0].cards).toHaveLength(0);
    expect(cols[1].cards[0].id).toBe(cardId);
  });

  it("preserves order of remaining cards in the source column", async () => {
    await createCard(columnIds[0], cards.task1);
    const c2 = await createCard(columnIds[0], cards.task2);
    const card2Id = c2.body.data.createCard.id;

    // Move task2 to column 1
    await request
      .post("/graphql").set("authorization", `Bearer ${token}`)
      .send({ query: MOVE_CARD, variables: { id: card2Id, toColumnId: columnIds[1], toOrder: 0 } });

    const cols = await getBoardCards();
    // task1 should remain at order 0 in column 0
    expect(cols[0].cards).toHaveLength(1);
    expect(cols[0].cards[0].order).toBe(0);
  });
});

describe("deleteCard", () => {
  it("removes the card from the board", async () => {
    const created = await createCard(columnIds[0]);
    const cardId = created.body.data.createCard.id;

    await request
      .post("/graphql").set("authorization", `Bearer ${token}`)
      .send({ query: DELETE_CARD, variables: { id: cardId } });

    const cols = await getBoardCards();
    expect(cols[0].cards).toHaveLength(0);
  });
});
