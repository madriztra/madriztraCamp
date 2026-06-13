import { decryptSecret } from "@/lib/crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { InstagramPublisher } from "@/lib/publishers/instagram";
import { TikTokPublisher } from "@/lib/publishers/tiktok";
import type { PublishPayload, PublishPlatform, SocialPublisher } from "@/lib/publishers/types";
import { YouTubeShortsPublisher } from "@/lib/publishers/youtube";
import { ConnectedAccount } from "@/models/ConnectedAccount";
import { nanoid } from "nanoid";

const publishers = {
  instagram: new InstagramPublisher(),
  tiktok: new TikTokPublisher(),
  youtube_shorts: new YouTubeShortsPublisher()
} satisfies Record<PublishPlatform, SocialPublisher>;

const accountProvider = {
  instagram: "instagram",
  tiktok: "tiktok",
  youtube_shorts: "youtube"
} as const;

export async function publishSocialPost(input: {
  userId: string;
  platform: PublishPlatform;
  connectedAccountId?: string | null;
  payload: PublishPayload;
}) {
  if ((process.env.PUBLISHING_MODE ?? "sandbox") !== "live") {
    return {
      externalId: `sandbox-${input.platform}-${nanoid(10)}`,
      status: "published" as const,
      raw: {
        mode: "sandbox",
        platform: input.platform,
        caption: input.payload.caption,
        mediaUrl: input.payload.mediaUrl ?? null
      }
    };
  }

  await connectToDatabase();

  const account = await ConnectedAccount.findOne({
    ...(input.connectedAccountId ? { _id: input.connectedAccountId } : {}),
    userId: input.userId,
    provider: accountProvider[input.platform],
    syncStatus: "healthy"
  }).select("+accessTokenEncrypted");

  if (!account?.accessTokenEncrypted) {
    throw new Error(`Connect a healthy ${accountProvider[input.platform]} account before publishing.`);
  }

  const result = await publishers[input.platform].publish({
    accountId: account.accountId,
    accessToken: decryptSecret(account.accessTokenEncrypted),
    payload: input.payload
  });

  account.lastSyncedAt = new Date();
  await account.save();

  return result;
}

export type { PublishPayload, PublishPlatform, PublishResult, SocialPublisher } from "@/lib/publishers/types";
