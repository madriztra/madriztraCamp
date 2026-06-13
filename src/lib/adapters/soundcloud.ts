import { fetchJson } from "@/lib/adapters/http";
import { AdapterConfigurationError, type AnalyticsSyncResult, type MusicPlatformAdapter, type TrackMetadata } from "@/lib/adapters/types";
import { getOptionalEnv } from "@/lib/env";

type SoundCloudTrack = {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url?: string;
  duration: number;
  genre?: string;
  created_at?: string;
  user: { username: string };
  playback_count?: number;
  likes_count?: number;
  reposts_count?: number;
  comment_count?: number;
};

type SoundCloudOEmbedResponse = {
  title: string;
  author_name?: string;
  thumbnail_url?: string;
};

function clientId() {
  const value = getOptionalEnv("SOUNDCLOUD_CLIENT_ID");

  if (!value) {
    throw new AdapterConfigurationError("soundcloud", "SOUNDCLOUD_CLIENT_ID");
  }

  return value;
}

async function resolveTrack(url: string) {
  const resolved = await fetchJson<SoundCloudTrack>(
    `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId()}`
  );

  if (!resolved.id) {
    throw new Error("SoundCloud track was not found.");
  }

  return resolved;
}

async function fetchSoundCloudOEmbed(url: string): Promise<TrackMetadata> {
  const embed = await fetchJson<SoundCloudOEmbedResponse>(
    `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
  );

  return {
    provider: "soundcloud",
    externalId: url,
    title: embed.title,
    artist: embed.author_name ?? "SoundCloud artist",
    genre: [],
    coverUrl: embed.thumbnail_url,
    platformUrl: url,
    raw: { mode: "free-oembed", embed }
  };
}

export class SoundCloudAdapter implements MusicPlatformAdapter {
  provider = "soundcloud" as const;

  async fetchMetadata(url: string): Promise<TrackMetadata> {
    const track = await resolveTrack(url).catch((error) => {
      if (error instanceof AdapterConfigurationError) {
        return null;
      }

      throw error;
    });

    if (!track) {
      return fetchSoundCloudOEmbed(url);
    }

    return {
      provider: this.provider,
      externalId: String(track.id),
      title: track.title,
      artist: track.user.username,
      genre: track.genre ? [track.genre] : [],
      coverUrl: track.artwork_url?.replace("-large", "-t500x500"),
      releaseDate: track.created_at,
      durationMs: track.duration,
      platformUrl: track.permalink_url,
      raw: track
    };
  }

  async syncAnalytics(externalId: string): Promise<AnalyticsSyncResult> {
    const capturedAt = new Date();
    const id = getOptionalEnv("SOUNDCLOUD_CLIENT_ID");

    if (!id) {
      return {
        provider: this.provider,
        externalId,
        metrics: [{ name: "soundcloud_free_mode", value: 1, capturedAt }],
        raw: { mode: "free" }
      };
    }

    const track = await fetchJson<SoundCloudTrack>(
      `https://api-v2.soundcloud.com/tracks/${externalId}?client_id=${id}`
    );

    return {
      provider: this.provider,
      externalId,
      metrics: [
        { name: "soundcloud_plays", value: track.playback_count ?? 0, capturedAt },
        { name: "soundcloud_likes", value: track.likes_count ?? 0, capturedAt },
        { name: "soundcloud_reposts", value: track.reposts_count ?? 0, capturedAt },
        { name: "soundcloud_comments", value: track.comment_count ?? 0, capturedAt }
      ],
      raw: track
    };
  }
}
