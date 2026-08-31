import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { User } from "../models/User";
import { Board } from "../models/Board";
import { Column } from "../models/Column";
import { Card } from "../models/Card";
import { signToken } from "../auth/jwt";
import { Context } from "../auth/context";
import { requireAuth, requireBoardAccess } from "../utils/permissions";

const findUserByLogin = (usernameOrEmail: string) =>
  User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail.toLowerCase() }],
  });

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;
      return User.findById(ctx.user.id);
    },

    myBoards: async (_: unknown, __: unknown, ctx: Context) => {
      const user = requireAuth(ctx);
      return Board.find({
        $or: [{ owner: user.id }, { "members.user": user.id }],
      }).sort({ createdAt: -1 });
    },

    board: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      await requireBoardAccess(ctx, id);
      return Board.findById(id);
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      { username, email, password }: { username: string; email: string; password: string }
    ) => {
      const exists = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
      if (exists) {
        throw new GraphQLError("Username or email already in use", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, passwordHash });
      return { token: signToken(String(user._id)), user };
    },

    login: async (
      _: unknown,
      { usernameOrEmail, password }: { usernameOrEmail: string; password: string }
    ) => {
      const user = await findUserByLogin(usernameOrEmail);
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return { token: signToken(String(user._id)), user };
    },

    createBoard: async (_: unknown, { name }: { name: string }, ctx: Context) => {
      const user = requireAuth(ctx);
      const board = await Board.create({
        name,
        owner: user.id,
        members: [{ user: user.id, role: "owner" }],
      });
      // Seed default columns.
      const defaults = ["To Do", "In Progress", "Done"];
      await Column.insertMany(
        defaults.map((title, order) => ({ board: board._id, title, order }))
      );
      return board;
    },

    renameBoard: async (
      _: unknown,
      { id, name }: { id: string; name: string },
      ctx: Context
    ) => {
      await requireBoardAccess(ctx, id, true);
      return Board.findByIdAndUpdate(id, { name }, { new: true });
    },

    deleteBoard: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      await requireBoardAccess(ctx, id, true);
      await Card.deleteMany({ board: id });
      await Column.deleteMany({ board: id });
      await Board.findByIdAndDelete(id);
      return true;
    },

    addMember: async (
      _: unknown,
      { boardId, usernameOrEmail }: { boardId: string; usernameOrEmail: string },
      ctx: Context
    ) => {
      const board = await requireBoardAccess(ctx, boardId, true);
      const newUser = await findUserByLogin(usernameOrEmail);
      if (!newUser) {
        throw new GraphQLError("User not found", { extensions: { code: "NOT_FOUND" } });
      }
      const already = board.members.some((m: any) => String(m.user) === String(newUser._id));
      if (!already) {
        board.members.push({ user: newUser._id, role: "member" } as any);
        await board.save();
      }
      return board;
    },

    createColumn: async (
      _: unknown,
      { boardId, title }: { boardId: string; title: string },
      ctx: Context
    ) => {
      await requireBoardAccess(ctx, boardId);
      const count = await Column.countDocuments({ board: boardId });
      return Column.create({ board: boardId, title, order: count });
    },

    renameColumn: async (
      _: unknown,
      { id, title }: { id: string; title: string },
      ctx: Context
    ) => {
      const column = await Column.findById(id);
      if (!column) throw new GraphQLError("Column not found", { extensions: { code: "NOT_FOUND" } });
      await requireBoardAccess(ctx, String(column.board));
      column.title = title;
      await column.save();
      return column;
    },

    deleteColumn: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const column = await Column.findById(id);
      if (!column) throw new GraphQLError("Column not found", { extensions: { code: "NOT_FOUND" } });
      await requireBoardAccess(ctx, String(column.board));
      await Card.deleteMany({ column: id });
      await Column.findByIdAndDelete(id);
      return true;
    },

    createCard: async (
      _: unknown,
      { columnId, title, description }: { columnId: string; title: string; description?: string },
      ctx: Context
    ) => {
      const column = await Column.findById(columnId);
      if (!column) throw new GraphQLError("Column not found", { extensions: { code: "NOT_FOUND" } });
      await requireBoardAccess(ctx, String(column.board));
      const count = await Card.countDocuments({ column: columnId });
      return Card.create({
        board: column.board,
        column: columnId,
        title,
        description: description || "",
        order: count,
      });
    },

    updateCard: async (
      _: unknown,
      {
        id,
        title,
        description,
        assigneeId,
        dueDate,
        labels,
      }: {
        id: string;
        title?: string;
        description?: string;
        assigneeId?: string;
        dueDate?: string;
        labels?: string[];
      },
      ctx: Context
    ) => {
      const card = await Card.findById(id);
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });
      await requireBoardAccess(ctx, String(card.board));

      if (title !== undefined) card.title = title;
      if (description !== undefined) card.description = description;
      if (assigneeId !== undefined) card.assignee = assigneeId as any;
      if (dueDate !== undefined) card.dueDate = dueDate ? new Date(dueDate) : null;
      if (labels !== undefined) card.labels = labels;
      await card.save();
      return card;
    },

    deleteCard: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const card = await Card.findById(id);
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });
      await requireBoardAccess(ctx, String(card.board));
      await Card.findByIdAndDelete(id);
      return true;
    },

    moveCard: async (
      _: unknown,
      { id, toColumnId, toOrder }: { id: string; toColumnId: string; toOrder: number },
      ctx: Context
    ) => {
      const card = await Card.findById(id);
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });
      await requireBoardAccess(ctx, String(card.board));

      const fromColumnId = String(card.column);

      // Place the card between its new neighbours, then renumber to clean integers.
      card.column = toColumnId as any;
      card.order = toOrder - 0.5;
      await card.save();

      const reindex = async (columnId: string) => {
        const cards = await Card.find({ column: columnId }).sort({ order: 1 });
        await Promise.all(
          cards.map((c, i) => Card.updateOne({ _id: c._id }, { $set: { order: i } }))
        );
      };

      await reindex(toColumnId);
      if (fromColumnId !== toColumnId) await reindex(fromColumnId);

      return Card.findById(id);
    },
  },

  // ----- Field resolvers -----
  Board: {
    id: (b: any) => b._id ?? b.id,
    owner: (b: any) => User.findById(b.owner),
    members: (b: any) =>
      b.members.map((m: any) => ({ user: () => User.findById(m.user), role: m.role })),
    columns: (b: any) => Column.find({ board: b._id }).sort({ order: 1 }),
  },

  Member: {
    user: (m: any) => (typeof m.user === "function" ? m.user() : User.findById(m.user)),
  },

  Column: {
    id: (c: any) => c._id ?? c.id,
    cards: (c: any) => Card.find({ column: c._id }).sort({ order: 1 }),
  },

  Card: {
    id: (c: any) => c._id ?? c.id,
    assignee: (c: any) => (c.assignee ? User.findById(c.assignee) : null),
    dueDate: (c: any) => (c.dueDate ? new Date(c.dueDate).toISOString() : null),
  },

  User: {
    id: (u: any) => u._id ?? u.id,
  },
};
