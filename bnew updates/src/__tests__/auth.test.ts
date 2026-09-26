import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "@jest/globals";
import { connectTestDB, closeTestDB, clearTestDB } from "./helpers/testDb";
import { buildTestApp } from "./helpers/testApp";
import { users } from "./fixtures/data";
import { REGISTER, LOGIN } from "./fixtures/operations";

let request: Awaited<ReturnType<typeof buildTestApp>>;

beforeAll(async () => {
  await connectTestDB();
  request = await buildTestApp();
});

afterEach(clearTestDB);
afterAll(closeTestDB);

const registerAlice = () =>
  request.post("/graphql").send({ query: REGISTER, variables: users.alice });

describe("register", () => {
  it("creates a user and returns a signed JWT", async () => {
    const res = await registerAlice();
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.register.token).toBeDefined();
    expect(res.body.data.register.user.username).toBe(users.alice.username);
    // password must never appear in the response
    expect(JSON.stringify(res.body)).not.toContain(users.alice.password);
  });

  it("rejects duplicate username", async () => {
    await registerAlice();
    const res = await registerAlice();
    expect(res.body.errors[0].message).toMatch(/already in use/i);
  });

  it("rejects duplicate email case-insensitively", async () => {
    await registerAlice();
    const res = await request.post("/graphql").send({
      query: REGISTER,
      variables: { ...users.alice, username: "different", email: users.alice.email.toUpperCase() },
    });
    expect(res.body.errors[0].message).toMatch(/already in use/i);
  });

  it("rejects an invalid email", async () => {
    const res = await request.post("/graphql").send({
      query: REGISTER,
      variables: { ...users.alice, email: "not-an-email" },
    });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request.post("/graphql").send({
      query: REGISTER,
      variables: { ...users.alice, password: "short" },
    });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("rejects a username with special characters", async () => {
    const res = await request.post("/graphql").send({
      query: REGISTER,
      variables: { ...users.alice, username: "bad name!" },
    });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("rejects a username shorter than 3 characters", async () => {
    const res = await request.post("/graphql").send({
      query: REGISTER,
      variables: { ...users.alice, username: "ab" },
    });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });
});

describe("login", () => {
  beforeEach(async () => { await registerAlice(); });

  it("logs in by username and returns a valid token", async () => {
    const res = await request.post("/graphql").send({
      query: LOGIN,
      variables: { usernameOrEmail: users.alice.username, password: users.alice.password },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.login.token).toBeDefined();
    expect(res.body.data.login.user.email).toBe(users.alice.email);
  });

  it("logs in by email case-insensitively", async () => {
    const res = await request.post("/graphql").send({
      query: LOGIN,
      variables: { usernameOrEmail: users.alice.email.toUpperCase(), password: users.alice.password },
    });
    expect(res.body.data.login.token).toBeDefined();
  });

  it("rejects a wrong password with UNAUTHENTICATED code", async () => {
    const res = await request.post("/graphql").send({
      query: LOGIN,
      variables: { usernameOrEmail: users.alice.username, password: "wrongpassword" },
    });
    expect(res.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });

  it("rejects a non-existent user", async () => {
    const res = await request.post("/graphql").send({
      query: LOGIN,
      variables: { usernameOrEmail: "nobody", password: "Password1!" },
    });
    expect(res.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });

  it("me query returns null when unauthenticated", async () => {
    const res = await request.post("/graphql").send({ query: "query { me { id username } }" });
    expect(res.body.data.me).toBeNull();
  });
});

beforeAll(async () => {
  await connectTestDB();
  request = await buildTestApp();
});

afterEach(clearTestDB);
afterAll(closeTestDB);

const registerUser = (overrides = {}) =>
  request
    .post("/graphql")
    .send({
      query: REGISTER,
      variables: { username: "kartik", email: "kartik@test.com", password: "password123", ...overrides },
    });

describe("register", () => {
  it("creates a user and returns a token", async () => {
    const res = await registerUser();
    expect(res.body.data.register.token).toBeDefined();
    expect(res.body.data.register.user.username).toBe("kartik");
    expect(res.body.errors).toBeUndefined();
  });

  it("rejects a duplicate username", async () => {
    await registerUser();
    const res = await registerUser();
    expect(res.body.errors[0].message).toMatch(/already in use/i);
  });

  it("rejects an invalid email", async () => {
    const res = await registerUser({ email: "not-an-email" });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await registerUser({ password: "short" });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });

  it("rejects a username with spaces", async () => {
    const res = await registerUser({ username: "bad name" });
    expect(res.body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
  });
});

describe("login", () => {
  beforeEach(async () => {
    await registerUser();
  });

  it("logs in by username and returns a token", async () => {
    const res = await request.post("/graphql").send({
      query: LOGIN,
      variables: { usernameOrEmail: "kartik", password: "password123" },
    });
    expect(res.body.data.login.token).toBeDefined();
    expect(res.body.data.login.user.email).toBe("kartik@test.com");
  });

  it("logs in by email", async () => {
    const res = await request.post("/graphql").send({
      query: LOGIN,
      variables: { usernameOrEmail: "kartik@test.com", password: "password123" },
    });
    expect(res.body.data.login.token).toBeDefined();
  });

  it("rejects a wrong password", async () => {
    const res = await request.post("/graphql").send({
      query: LOGIN,
      variables: { usernameOrEmail: "kartik", password: "wrongpassword" },
    });
    expect(res.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });
});
