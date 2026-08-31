import { Schema, model, InferSchemaType } from "mongoose";

const activityLogSchema = new Schema(
  {
    board:               { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    action:              { type: String, required: true }, // created | updated | moved | deleted
    entityType:          { type: String, required: true }, // card | column | board
    entityTitle:         { type: String, required: true },
    details:             { type: String, default: "" },
    performedBy:         { type: Schema.Types.ObjectId, ref: "User", default: null },
    performedByUsername: { type: String, default: "unknown" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type ActivityLogDoc = InferSchemaType<typeof activityLogSchema>;
export const ActivityLog = model("ActivityLog", activityLogSchema);
