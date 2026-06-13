import type { PublishResult, SocialPublisher } from "@/lib/publishers/types";

export class YouTubeShortsPublisher implements SocialPublisher {
  platform = "youtube_shorts" as const;

  async publish(input: {
    accountId: string;
    accessToken: string;
    payload: {
      caption: string;
      hashtags?: string[];
      cta?: string;
      mediaUrl?: string;
      title?: string;
      privacyLevel?: string;
    };
  }): Promise<PublishResult> {
    if (!input.payload.mediaUrl) {
      throw new Error("YouTube Shorts publishing requires payload.mediaUrl.");
    }

    const mediaResponse = await fetch(input.payload.mediaUrl);

    if (!mediaResponse.ok) {
      throw new Error(`Unable to download scheduled video: HTTP ${mediaResponse.status}`);
    }

    const videoBytes = await mediaResponse.arrayBuffer();
    const contentType = mediaResponse.headers.get("content-type") ?? "video/mp4";
    const metadataResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Length": String(videoBytes.byteLength),
          "X-Upload-Content-Type": contentType
        },
        body: JSON.stringify({
          snippet: {
            title: (input.payload.title ?? input.payload.caption).slice(0, 100),
            description: [input.payload.caption, input.payload.cta, input.payload.hashtags?.join(" ")]
              .filter(Boolean)
              .join("\n\n"),
            categoryId: "10"
          },
          status: {
            privacyStatus: input.payload.privacyLevel ?? "public",
            selfDeclaredMadeForKids: false
          }
        })
      }
    );

    if (!metadataResponse.ok) {
      throw new Error(`YouTube upload initialization failed: HTTP ${metadataResponse.status}`);
    }

    const uploadUrl = metadataResponse.headers.get("location");

    if (!uploadUrl) {
      throw new Error("YouTube did not return a resumable upload URL.");
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(videoBytes.byteLength)
      },
      body: videoBytes
    });

    if (!uploadResponse.ok) {
      throw new Error(`YouTube upload failed: HTTP ${uploadResponse.status}`);
    }

    const result = (await uploadResponse.json()) as { id: string };
    return { externalId: result.id, status: "published", raw: result };
  }
}
