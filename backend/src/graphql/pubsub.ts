import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const boardChannel = (boardId: string) => `BOARD_${boardId}`;
export const activityChannel = (boardId: string) => `ACTIVITY_${boardId}`;

export const publishBoardUpdated = (boardId: string) =>
  pubsub.publish(boardChannel(boardId), { boardId });

export const publishActivity = (boardId: string, entry: object) =>
  pubsub.publish(activityChannel(boardId), { activityEntry: entry });
