export const mockUser = {
  id: "user-1",
  username: "alice",
  email: "alice@test.com",
};

export const mockToken = "mock.jwt.token";

export const mockBoards = [
  { id: "board-1", name: "Alpha Project", createdAt: "2026-01-01" },
  { id: "board-2", name: "Beta Project",  createdAt: "2026-02-01" },
];

export const mockBoard = {
  id: "board-1",
  name: "Alpha Project",
  members: [{ user: mockUser, role: "owner" }],
  columns: [
    {
      id: "col-1",
      title: "To Do",
      order: 0,
      cards: [
        {
          id: "card-1",
          title: "First task",
          description: "Do the thing",
          order: 0,
          labels: ["bug"],
          dueDate: "2026-12-31T00:00:00.000Z",
          assignee: mockUser,
        },
      ],
    },
    { id: "col-2", title: "In Progress", order: 1, cards: [] },
    { id: "col-3", title: "Done",        order: 2, cards: [] },
  ],
};
