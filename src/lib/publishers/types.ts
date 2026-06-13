export type PublishPlatform = "instagram" | "tiktok" | "youtube_shorts";

export type PublishPayload = {
  caption: string;
  hashtags?: string[];
  cta?: string;
  mediaUrl?: string;
  title?: string;
  privacyLevel?: string;
};

export type PublishResult = {
  externalId: string;
  status: "published" | "processing";
  raw?: unknown;
};

export interface SocialPublisher {
  platform: PublishPlatform;
  publish(input: {
    accountId: string;
    accessToken: string;
    payload: PublishPayload;
  }): Promise<PublishResult>;
}
