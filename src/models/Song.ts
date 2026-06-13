import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const platformUrlsSchema = new Schema(
  {
    spotify: String,
    appleMusic: String,
    soundCloud: String,
    youtubeMusic: String,
    deezer: String,
    amazonMusic: String
  },
  { _id: false }
);

const seoSchema = new Schema(
  {
    title: String,
    description: String,
    keywords: [String],
    openGraph: {
      title: String,
      description: String,
      image: String
    },
    twitterCard: {
      card: { type: String, default: "summary_large_image" },
      title: String,
      description: String,
      image: String
    },
    jsonLd: Schema.Types.Mixed
  },
  { _id: false }
);

const songSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, trim: true },
    genre: [{ type: String, trim: true }],
    releaseDate: { type: Date },
    durationMs: { type: Number, min: 0 },
    audioUrl: { type: String },
    coverUrl: { type: String },
    source: { type: String, enum: ["upload", "spotify", "youtube", "soundcloud", "apple"], default: "upload" },
    externalIds: {
      spotify: String,
      youtube: String,
      soundcloud: String,
      appleMusic: String
    },
    platformUrls: platformUrlsSchema,
    seo: seoSchema,
    status: { type: String, enum: ["draft", "ready", "archived"], default: "ready", index: true }
  },
  { timestamps: true }
);

songSchema.index({ title: "text", artist: "text", album: "text" });

export type SongDocument = InferSchemaType<typeof songSchema> & { _id: Types.ObjectId };

export const Song: Model<SongDocument> =
  (models.Song as Model<SongDocument>) ?? model<SongDocument>("Song", songSchema);
