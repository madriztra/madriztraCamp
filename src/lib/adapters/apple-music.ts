import { fetchJson } from "@/lib/adapters/http";
import { AdapterConfigurationError, type AnalyticsSyncResult, type MusicPlatformAdapter, type TrackMetadata } from "@/lib/adapters/types";
import { getOptionalEnv } from "@/lib/env";

type AppleMusicSongResponse = {
  data: Array<{
    id: string;
    attributes: {
      name: string;
      artistName: string;
      albumName?: string;
      artwork?: { url: string; width: number; height: number };
      genreNames?: string[];
      releaseDate?: string;
      durationInMillis?: number;
      url: string;
      playParams?: { id: string };
    };
  }>;
};

type ITunesLookupResponse = {
  results: Array<{
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName?: string;
    artworkUrl100?: string;
    primaryGenreName?: string;
    releaseDate?: string;
    trackTimeMillis?: number;
    trackViewUrl?: string;
  }>;
};

function developerToken() {
  const token = getOptionalEnv("APPLE_MUSIC_DEVELOPER_TOKEN");

  if (!token) {
    throw new AdapterConfigurationError("appleMusic", "APPLE_MUSIC_DEVELOPER_TOKEN");
  }

  return token;
}

function storefront() {
  return process.env.APPLE_MUSIC_STOREFRONT ?? "us";
}

function parseSongId(url: string) {
  const parsed = new URL(url);
  const songId = parsed.searchParams.get("i") ?? parsed.pathname.split("/").filter(Boolean).at(-1);

  if (!songId) {
    throw new Error("Enter a valid Apple Music song URL.");
  }

  return songId;
}

async function getSong(externalId: string) {
  const response = await fetchJson<AppleMusicSongResponse>(
    `https://api.music.apple.com/v1/catalog/${storefront()}/songs/${externalId}`,
    {
      headers: {
        Authorization: `Bearer ${developerToken()}`
      }
    }
  );

  const song = response.data[0];

  if (!song) {
    throw new Error("Apple Music song was not found.");
  }

  return song;
}

async function getITunesSong(externalId: string) {
  const response = await fetchJson<ITunesLookupResponse>(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(externalId)}`
  );

  return response.results[0] ?? null;
}

export class AppleMusicAdapter implements MusicPlatformAdapter {
  provider = "appleMusic" as const;

  async fetchMetadata(url: string): Promise<TrackMetadata> {
    const externalId = parseSongId(url);
    const song = await getSong(externalId).catch((error) => {
      if (error instanceof AdapterConfigurationError) {
        return null;
      }

      throw error;
    });

    if (!song) {
      const fallback = await getITunesSong(externalId);

      if (!fallback) {
        throw new Error("Apple Music song was not found.");
      }

      return {
        provider: this.provider,
        externalId: String(fallback.trackId),
        title: fallback.trackName,
        artist: fallback.artistName,
        album: fallback.collectionName,
        genre: fallback.primaryGenreName ? [fallback.primaryGenreName] : [],
        coverUrl: fallback.artworkUrl100?.replace("100x100", "1200x1200"),
        releaseDate: fallback.releaseDate,
        durationMs: fallback.trackTimeMillis,
        platformUrl: fallback.trackViewUrl ?? url,
        raw: { mode: "free-itunes-lookup", fallback }
      };
    }
    const artworkUrl = song.attributes.artwork?.url
      .replace("{w}", String(song.attributes.artwork.width))
      .replace("{h}", String(song.attributes.artwork.height));

    return {
      provider: this.provider,
      externalId,
      title: song.attributes.name,
      artist: song.attributes.artistName,
      album: song.attributes.albumName,
      genre: song.attributes.genreNames ?? [],
      coverUrl: artworkUrl,
      releaseDate: song.attributes.releaseDate,
      durationMs: song.attributes.durationInMillis,
      platformUrl: song.attributes.url,
      raw: song
    };
  }

  async syncAnalytics(externalId: string): Promise<AnalyticsSyncResult> {
    const song = await getSong(externalId).catch((error) => {
      if (error instanceof AdapterConfigurationError) {
        return null;
      }

      throw error;
    });

    return {
      provider: this.provider,
      externalId,
      metrics: [{ name: "apple_music_catalog_available", value: 1, capturedAt: new Date() }],
      raw: song ?? { mode: "free-itunes-lookup" }
    };
  }
}
