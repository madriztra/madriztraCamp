import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    image: { type: String },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ["artist", "label", "admin"], default: "artist", index: true },
    emailVerified: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    profile: {
      artistName: { type: String, trim: true },
      labelName: { type: String, trim: true },
      primaryGenre: { type: String, trim: true },
      timezone: { type: String, default: "UTC" },
      website: { type: String, trim: true }
    },
    plan: {
      tier: { type: String, enum: ["free", "growth", "pro", "label"], default: "free" },
      status: { type: String, enum: ["active", "trialing", "past_due", "canceled"], default: "active" }
    }
  },
  { timestamps: true }
);

userSchema.index({ "profile.artistName": "text", "profile.labelName": "text" });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument>) ?? model<UserDocument>("User", userSchema);
