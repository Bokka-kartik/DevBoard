import { GraphQLError } from "graphql";
import { Board } from "../models/Board";
import { Context } from "../auth/context";

export const requireAuth = (ctx: Context) => {
  if (!ctx.user) {
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.user;
};

// Ensures the current user is the owner or a member of the board.
export const requireBoardAccess = async (
  ctx: Context,
  boardId: string,
  ownerOnly = false
) => {
  const user = requireAuth(ctx);
  const board = await Board.findById(boardId);
  if (!board) {
    throw new GraphQLError("Board not found", { extensions: { code: "NOT_FOUND" } });
  }

  const isOwner = String(board.owner) === user.id;
  const isMember = board.members.some((m: any) => String(m.user) === user.id);

  if (ownerOnly && !isOwner) {
    throw new GraphQLError("Owner permission required", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  if (!isOwner && !isMember) {
    throw new GraphQLError("You do not have access to this board", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return board;
};
