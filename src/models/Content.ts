import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const contentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    platform: {
      type: String,
      enum: ["tiktok", "instagram", "youtube_shorts"],
      required: true,
      index: true
    },
    type: { type: String, enum: ["caption", "idea", "short_script"], default: "idea" },
    idea: { type: String, required: true },
    hook: { type: String },
    caption: { type: String, required: true },
    hashtags: [{ type: String, trim: true }],
    cta: { type: String, required: true },
    creativeDirection: { type: String },
    status: {
      type: String,
      enum: ["draft", "approved", "scheduled", "published", "failed"],
      default: "draft",
      index: true
    },
    scheduledFor: { type: Date, index: true },
    performanceScore: { type: Number, default: 0, min: 0, max: 100 }
  },
  { timestamps: true }
);

contentSchema.index({ userId: 1, campaignId: 1, platform: 1 });

export type ContentDocument = InferSchemaType<typeof contentSchema> & { _id: Types.ObjectId };

export const Content: Model<ContentDocument> =
  (models.Content as Model<ContentDocument>) ?? model<ContentDocument>("Content", contentSchema);
