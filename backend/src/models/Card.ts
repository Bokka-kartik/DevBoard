import { Schema, model, InferSchemaType } from "mongoose";

const cardSchema = new Schema(
  {
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    column: { type: Schema.Types.ObjectId, ref: "Column", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignee: { type: Schema.Types.ObjectId, ref: "User", default: null },
    dueDate: { type: Date, default: null },
    labels: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type CardDoc = InferSchemaType<typeof cardSchema>;
export const Card = model("Card", cardSchema);
