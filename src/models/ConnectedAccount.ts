import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const connectedAccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: {
      type: String,
      enum: ["spotify", "youtube", "soundcloud", "appleMusic", "instagram", "tiktok"],
      required: true,
      index: true
    },
    accountId: { type: String, required: true },
    displayName: { type: String, required: true },
    accessTokenEncrypted: { type: String, select: false },
    refreshTokenEncrypted: { type: String, select: false },
    tokenExpiresAt: { type: Date },
    scopes: [String],
    syncStatus: { type: String, enum: ["healthy", "needs_reauth", "failed"], default: "healthy" },
    lastSyncedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

connectedAccountSchema.index({ userId: 1, provider: 1, accountId: 1 }, { unique: true });

export type ConnectedAccountDocument = InferSchemaType<typeof connectedAccountSchema> & {
  _id: Types.ObjectId;
};

export const ConnectedAccount: Model<ConnectedAccountDocument> =
  (models.ConnectedAccount as Model<ConnectedAccountDocument>) ??
  model<ConnectedAccountDocument>("ConnectedAccount", connectedAccountSchema);
