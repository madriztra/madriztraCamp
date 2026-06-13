import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const scheduledPostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true, index: true },
    connectedAccountId: { type: Schema.Types.ObjectId, ref: "ConnectedAccount" },
    platform: {
      type: String,
      enum: ["tiktok", "instagram", "youtube_shorts"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "published", "failed"],
      default: "pending",
      index: true
    },
    scheduledFor: { type: Date, required: true, index: true },
    publishedAt: { type: Date },
    attempts: { type: Number, default: 0 },
    bullJobId: { type: String },
    lastError: { type: String },
    payload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

scheduledPostSchema.index({ userId: 1, status: 1, scheduledFor: 1 });

export type ScheduledPostDocument = InferSchemaType<typeof scheduledPostSchema> & { _id: Types.ObjectId };

export const ScheduledPost: Model<ScheduledPostDocument> =
  (models.ScheduledPost as Model<ScheduledPostDocument>) ??
  model<ScheduledPostDocument>("ScheduledPost", scheduledPostSchema);
