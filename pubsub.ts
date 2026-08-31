import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const boardChannel = (boardId: string) => `BOARD_${boardId}`;

// Notify subscribers that a board's contents changed.
export const publishBoardUpdated = (boardId: string) =>
  pubsub.publish(boardChannel(boardId), { boardId });
