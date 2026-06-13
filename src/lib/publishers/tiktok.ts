import { fetchJson } from "@/lib/adapters/http";
import type { PublishResult, SocialPublisher } from "@/lib/publishers/types";

type TikTokPublishResponse = {
  data: {
    publish_id: string;
  };
};

export class TikTokPublisher implements SocialPublisher {
  platform = "tiktok" as const;

  async publish(input: {
    accountId: string;
    accessToken: string;
    payload: {
      caption: string;
      hashtags?: string[];
      cta?: string;
      mediaUrl?: string;
      privacyLevel?: string;
    };
  }): Promise<PublishResult> {
    if (!input.payload.mediaUrl) {
      throw new Error("TikTok publishing requires payload.mediaUrl for a verified public video URL.");
    }

    const title = [input.payload.caption, input.payload.cta, input.payload.hashtags?.join(" ")]
      .filter(Boolean)
      .join(" ")
      .slice(0, 2200);
    const response = await fetchJson<TikTokPublishResponse>(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          post_info: {
            title,
            privacy_level: input.payload.privacyLevel ?? "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: input.payload.mediaUrl
          }
        })
      }
    );

    return { externalId: response.data.publish_id, status: "processing", raw: response };
  }
}
