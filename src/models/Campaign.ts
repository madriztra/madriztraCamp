import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const campaignSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", required: true, index: true },
    name: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1, max: 365 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "failed"],
      default: "draft",
      index: true
    },
    contentPlan: {
      audience: String,
      positioning: String,
      postingCadence: String,
      creativeThemes: [String],
      recommendedWindows: [String]
    },
    goals: {
      streams: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      followers: { type: Number, default: 0 }
    },
    aiInsights: [String],
    launchedAt: { type: Date }
  },
  { timestamps: true }
);

campaignSchema.index({ userId: 1, status: 1, startDate: -1 });

export type CampaignDocument = InferSchemaType<typeof campaignSchema> & { _id: Types.ObjectId };

export const Campaign: Model<CampaignDocument> =
  (models.Campaign as Model<CampaignDocument>) ?? model<CampaignDocument>("Campaign", campaignSchema);
