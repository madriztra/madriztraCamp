import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const platformSchema = new Schema(
  {
    platform: {
      type: String,
      enum: ["spotify", "appleMusic", "soundCloud", "youtubeMusic", "deezer", "amazonMusic"],
      required: true
    },
    url: { type: String, required: true },
    clicks: { type: Number, default: 0 }
  },
  { _id: false }
);

const smartLinkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: "Song", required: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    coverUrl: { type: String },
    platforms: [platformSchema],
    seo: {
      title: String,
      description: String,
      keywords: [String],
      openGraph: Schema.Types.Mixed,
      twitterCard: Schema.Types.Mixed,
      jsonLd: Schema.Types.Mixed
    },
    clickCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

smartLinkSchema.index({ userId: 1, createdAt: -1 });
smartLinkSchema.index({ title: "text", artist: "text" });

export type SmartLinkDocument = InferSchemaType<typeof smartLinkSchema> & { _id: Types.ObjectId };

export const SmartLink: Model<SmartLinkDocument> =
  (models.SmartLink as Model<SmartLinkDocument>) ??
  model<SmartLinkDocument>("SmartLink", smartLinkSchema);
