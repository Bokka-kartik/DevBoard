import { Schema, model, InferSchemaType } from "mongoose";

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
  },
  { _id: false }
);

const boardSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

export type BoardDoc = InferSchemaType<typeof boardSchema>;
export const Board = model("Board", boardSchema);
