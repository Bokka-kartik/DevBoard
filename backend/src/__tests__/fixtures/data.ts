// Shared test fixtures — keeps test data consistent and DRY across all suites.

export const users = {
  alice: { username: "alice", email: "alice@test.com", password: "Password1!" },
  bob:   { username: "bob",   email: "bob@test.com",   password: "Password2!" },
};

export const boards = {
  main:    { name: "Main Project" },
  side:    { name: "Side Project" },
  invalid: { name: "   " },          // whitespace-only — should fail validation
  tooLong: { name: "x".repeat(101) },
};

export const columns = {
  backlog:    { title: "Backlog" },
  inProgress: { title: "In Progress" },
  done:       { title: "Done" },
  invalid:    { title: "" },
};

export const cards = {
  task1:   { title: "Design the schema", description: "Draft ERD and GraphQL types" },
  task2:   { title: "Build resolvers" },
  invalid: { title: "" },
  longDesc: {
    title: "Valid card",
    description: "x".repeat(2001), // exceeds 2000 char limit
  },
};
