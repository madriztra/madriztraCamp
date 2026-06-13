import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const analyticsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    smartLinkId: { type: Schema.Types.ObjectId, ref: "SmartLink", index: true },
    platform: { type: String, index: true },
    eventType: {
      type: String,
      enum: ["view", "click", "stream", "save", "share", "follow"],
      required: true,
      index: true
    },
    value: { type: Number, default: 1 },
    source: { type: String, index: true },
    country: { type: String, index: true },
    city: { type: String },
    device: { type: String, enum: ["desktop", "mobile", "tablet", "bot", "unknown"], default: "unknown" },
    occurredAt: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

analyticsSchema.index({ userId: 1, eventType: 1, occurredAt: -1 });

export type AnalyticsDocument = InferSchemaType<typeof analyticsSchema> & { _id: Types.ObjectId };

export const Analytics: Model<AnalyticsDocument> =
  (models.Analytics as Model<AnalyticsDocument>) ??
  model<AnalyticsDocument>("Analytics", analyticsSchema);
