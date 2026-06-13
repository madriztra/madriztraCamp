import { AppleMusicAdapter } from "@/lib/adapters/apple-music";
import { SoundCloudAdapter } from "@/lib/adapters/soundcloud";
import { SpotifyAdapter } from "@/lib/adapters/spotify";
import type { MusicPlatformAdapter } from "@/lib/adapters/types";
import { YouTubeAdapter } from "@/lib/adapters/youtube";

export const adapters = {
  spotify: new SpotifyAdapter(),
  youtube: new YouTubeAdapter(),
  soundcloud: new SoundCloudAdapter(),
  appleMusic: new AppleMusicAdapter()
} satisfies Record<string, MusicPlatformAdapter>;

export function adapterForUrl(url: string): MusicPlatformAdapter {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();

  if (host.includes("spotify.com")) {
    return adapters.spotify;
  }

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return adapters.youtube;
  }

  if (host.includes("soundcloud.com")) {
    return adapters.soundcloud;
  }

  if (host.includes("music.apple.com")) {
    return adapters.appleMusic;
  }

  throw new Error("Unsupported music URL. Use Spotify, YouTube, SoundCloud, or Apple Music.");
}

export type { AnalyticsSyncResult, MusicPlatformAdapter, MusicProvider, TrackMetadata } from "@/lib/adapters/types";
