import { fetchJson } from "@/lib/adapters/http";
import { AdapterConfigurationError, type AnalyticsSyncResult, type MusicPlatformAdapter, type TrackMetadata } from "@/lib/adapters/types";
import { getOptionalEnv } from "@/lib/env";

type YouTubeVideosResponse = {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      publishedAt: string;
      tags?: string[];
      thumbnails: Record<string, { url: string; width: number; height: number }>;
    };
    contentDetails: { duration: string };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
};

type YouTubeOEmbedResponse = {
  title: string;
  author_name: string;
  thumbnail_url?: string;
};

function parseVideoId(url: string): string {
  const parsed = new URL(url);

  if (parsed.hostname.includes("youtu.be")) {
    return parsed.pathname.replace("/", "");
  }

  if (parsed.searchParams.get("v")) {
    return parsed.searchParams.get("v") as string;
  }

  const shortsMatch = parsed.pathname.match(/\/shorts\/([^/]+)/);
  if (shortsMatch?.[1]) {
    return shortsMatch[1];
  }

  throw new Error("Enter a valid YouTube or YouTube Music URL.");
}

function parseIsoDuration(value: string): number {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2] ?? 0);
  const seconds = Number(match?.[3] ?? 0);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function apiKey() {
  const key = getOptionalEnv("YOUTUBE_API_KEY");

  if (!key) {
    throw new AdapterConfigurationError("youtube", "YOUTUBE_API_KEY");
  }

  return key;
}

async function getVideo(externalId: string) {
  const response = await fetchJson<YouTubeVideosResponse>(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${externalId}&key=${apiKey()}`
  );

  const video = response.items[0];

  if (!video) {
    throw new Error("YouTube video was not found.");
  }

  return video;
}

async function fetchYouTubeOEmbed(url: string, externalId: string): Promise<TrackMetadata> {
  const embed = await fetchJson<YouTubeOEmbedResponse>(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
  );

  return {
    provider: "youtube",
    externalId,
    title: embed.title,
    artist: embed.author_name,
    genre: [],
    coverUrl: embed.thumbnail_url,
    platformUrl: url,
    raw: { mode: "free-oembed", embed }
  };
}

export class YouTubeAdapter implements MusicPlatformAdapter {
  provider = "youtube" as const;

  async fetchMetadata(url: string): Promise<TrackMetadata> {
    const externalId = parseVideoId(url);
    const video = await getVideo(externalId).catch((error) => {
      if (error instanceof AdapterConfigurationError) {
        return null;
      }

      throw error;
    });

    if (!video) {
      return fetchYouTubeOEmbed(url, externalId);
    }
    const largestThumbnail = Object.values(video.snippet.thumbnails).sort((a, b) => b.width - a.width)[0];

    return {
      provider: this.provider,
      externalId,
      title: video.snippet.title,
      artist: video.snippet.channelTitle,
      genre: video.snippet.tags?.slice(0, 8) ?? [],
      coverUrl: largestThumbnail?.url,
      releaseDate: video.snippet.publishedAt,
      durationMs: parseIsoDuration(video.contentDetails.duration),
      platformUrl: url,
      raw: video
    };
  }

  async syncAnalytics(externalId: string): Promise<AnalyticsSyncResult> {
    const video = await getVideo(externalId).catch((error) => {
      if (error instanceof AdapterConfigurationError) {
        return null;
      }

      throw error;
    });
    const capturedAt = new Date();

    if (!video) {
      return {
        provider: this.provider,
        externalId,
        metrics: [{ name: "youtube_free_mode", value: 1, capturedAt }],
        raw: { mode: "free" }
      };
    }

    return {
      provider: this.provider,
      externalId,
      metrics: [
        { name: "youtube_views", value: Number(video.statistics?.viewCount ?? 0), capturedAt },
        { name: "youtube_likes", value: Number(video.statistics?.likeCount ?? 0), capturedAt },
        { name: "youtube_comments", value: Number(video.statistics?.commentCount ?? 0), capturedAt }
      ],
      raw: video
    };
  }
}
