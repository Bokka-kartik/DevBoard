// Unit-tests for the Zod validation layer itself — no DB or HTTP needed.
import { describe, it, expect } from "@jest/globals";
import { validate, RegisterInput, BoardNameInput, CardCreateInput, CardUpdateInput } from "../validation/schemas";

describe("RegisterInput", () => {
  const valid = { username: "alice_99", email: "alice@test.com", password: "Password1!" };

  it("accepts a valid payload", () => {
    expect(() => validate(RegisterInput, valid)).not.toThrow();
  });

  it("rejects username with space", () => {
    expect(() => validate(RegisterInput, { ...valid, username: "bad name" })).toThrow("only contain");
  });

  it("rejects username shorter than 3 chars", () => {
    expect(() => validate(RegisterInput, { ...valid, username: "ab" })).toThrow("3 characters");
  });

  it("rejects invalid email", () => {
    expect(() => validate(RegisterInput, { ...valid, email: "nope" })).toThrow("email");
  });

  it("rejects password shorter than 8 chars", () => {
    expect(() => validate(RegisterInput, { ...valid, password: "short" })).toThrow("8 characters");
  });
});

describe("BoardNameInput", () => {
  it("trims whitespace and rejects a blank name", () => {
    expect(() => validate(BoardNameInput, { name: "   " })).toThrow();
  });

  it("accepts a normal name", () => {
    expect(validate(BoardNameInput, { name: "  My Board  " }).name).toBe("My Board");
  });

  it("rejects a name over 100 characters", () => {
    expect(() => validate(BoardNameInput, { name: "x".repeat(101) })).toThrow("too long");
  });
});

describe("CardCreateInput", () => {
  it("rejects an empty title", () => {
    expect(() => validate(CardCreateInput, { title: "" })).toThrow();
  });

  it("rejects a description over 2000 characters", () => {
    expect(() => validate(CardCreateInput, { title: "ok", description: "x".repeat(2001) })).toThrow();
  });
});

describe("CardUpdateInput", () => {
  it("accepts partial updates (all fields optional)", () => {
    expect(() => validate(CardUpdateInput, {})).not.toThrow();
    expect(() => validate(CardUpdateInput, { title: "New" })).not.toThrow();
  });

  it("rejects more than 10 labels", () => {
    const labels = Array.from({ length: 11 }, (_, i) => `label${i}`);
    expect(() => validate(CardUpdateInput, { labels })).toThrow("Too many labels");
  });

  it("rejects an invalid date string", () => {
    expect(() => validate(CardUpdateInput, { dueDate: "not-a-date" })).toThrow("Invalid date");
  });

  it("accepts a valid ISO date string", () => {
    expect(() => validate(CardUpdateInput, { dueDate: "2026-12-31" })).not.toThrow();
  });
});
