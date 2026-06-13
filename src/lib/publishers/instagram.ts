import { fetchJson } from "@/lib/adapters/http";
import type { PublishResult, SocialPublisher } from "@/lib/publishers/types";

type InstagramContainerResponse = {
  id: string;
};

type InstagramPublishResponse = {
  id: string;
};

export class InstagramPublisher implements SocialPublisher {
  platform = "instagram" as const;

  async publish(input: {
    accountId: string;
    accessToken: string;
    payload: { caption: string; hashtags?: string[]; cta?: string; mediaUrl?: string };
  }): Promise<PublishResult> {
    if (!input.payload.mediaUrl) {
      throw new Error("Instagram publishing requires payload.mediaUrl for a public video.");
    }

    const caption = [input.payload.caption, input.payload.cta, input.payload.hashtags?.join(" ")]
      .filter(Boolean)
      .join("\n\n");
    const createParams = new URLSearchParams({
      media_type: "REELS",
      video_url: input.payload.mediaUrl,
      caption,
      share_to_feed: "true",
      access_token: input.accessToken
    });
    const container = await fetchJson<InstagramContainerResponse>(
      `https://graph.facebook.com/v20.0/${input.accountId}/media`,
      {
        method: "POST",
        body: createParams,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );
    const publishParams = new URLSearchParams({
      creation_id: container.id,
      access_token: input.accessToken
    });
    const published = await fetchJson<InstagramPublishResponse>(
      `https://graph.facebook.com/v20.0/${input.accountId}/media_publish`,
      {
        method: "POST",
        body: publishParams,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    return { externalId: published.id, status: "published", raw: published };
  }
}
