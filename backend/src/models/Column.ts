import { Schema, model, InferSchemaType } from "mongoose";

const columnSchema = new Schema(
  {
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ColumnDoc = InferSchemaType<typeof columnSchema>;
export const Column = model("Column", columnSchema);
