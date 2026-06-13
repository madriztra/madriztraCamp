import { AdapterConfigurationError, type AnalyticsSyncResult, type MusicPlatformAdapter, type TrackMetadata } from "@/lib/adapters/types";
import { fetchJson } from "@/lib/adapters/http";
import { getOptionalEnv } from "@/lib/env";

type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
};

type SpotifyTrackResponse = {
  id: string;
  name: string;
  popularity: number;
  external_urls: { spotify: string };
  duration_ms: number;
  album: {
    name: string;
    release_date: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  artists: Array<{ id: string; name: string }>;
};

type SpotifyArtistsResponse = {
  artists: Array<{ id: string; genres: string[] }>;
};

type SpotifyOEmbedResponse = {
  title: string;
  author_name?: string;
  thumbnail_url?: string;
  provider_name: string;
};

type ITunesSearchResponse = {
  results: Array<{
    wrapperType?: string;
    kind?: string;
    trackName?: string;
    artistName?: string;
    collectionName?: string;
    primaryGenreName?: string;
    releaseDate?: string;
    trackTimeMillis?: number;
    artworkUrl100?: string;
    trackViewUrl?: string;
  }>;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

function parseSpotifyTrackId(url: string): string {
  const match = url.match(/spotify\.com\/track\/([A-Za-z0-9]+)/) ?? url.match(/^spotify:track:([A-Za-z0-9]+)/);

  if (!match?.[1]) {
    throw new Error("Enter a valid Spotify track URL.");
  }

  return match[1];
}

async function getSpotifyToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) {
    return tokenCache.token;
  }

  const clientId = getOptionalEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = getOptionalEnv("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new AdapterConfigurationError("spotify", "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET");
  }

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const response = await fetchJson<SpotifyTokenResponse>("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  tokenCache = {
    token: response.access_token,
    expiresAt: Date.now() + response.expires_in * 1000
  };

  return response.access_token;
}

async function fetchSpotifyOEmbed(url: string, externalId: string): Promise<TrackMetadata> {
  const embed = await fetchJson<SpotifyOEmbedResponse>(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
  );
  const parsed = parseOEmbedTitle(embed.title, embed.author_name);
  const enriched = await enrichFromITunes(parsed.title, parsed.artist).catch(() => null);

  return {
    provider: "spotify",
    externalId,
    title: enriched?.trackName ?? parsed.title,
    artist: enriched?.artistName ?? parsed.artist,
    album: enriched?.collectionName,
    genre: enriched?.primaryGenreName ? [enriched.primaryGenreName] : [],
    coverUrl: enriched?.artworkUrl100?.replace("100x100", "1200x1200") ?? embed.thumbnail_url,
    releaseDate: enriched?.releaseDate,
    durationMs: enriched?.trackTimeMillis,
    platformUrl: url,
    raw: { mode: "free-oembed-itunes", embed, enriched }
  };
}

function parseOEmbedTitle(title: string, authorName?: string) {
  const normalized = title.replace(/\s+/g, " ").trim();

  if (authorName?.trim()) {
    return { title: normalized, artist: authorName.trim() };
  }

  const byMatch = normalized.match(/^(?<title>.+?)\s+by\s+(?<artist>.+)$/i);
  if (byMatch?.groups?.title && byMatch.groups.artist) {
    return {
      title: byMatch.groups.title.trim(),
      artist: byMatch.groups.artist.trim()
    };
  }

  const dashParts = normalized.split(" - ");
  if (dashParts.length >= 2) {
    return {
      artist: dashParts[0].trim(),
      title: dashParts.slice(1).join(" - ").trim()
    };
  }

  return { title: normalized, artist: "Unknown artist" };
}

function scoreITunesResult(result: ITunesSearchResponse["results"][number], title: string, artist: string) {
  const clean = (value?: string) => value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
  const resultTitle = clean(result.trackName);
  const resultArtist = clean(result.artistName);
  const targetTitle = clean(title);
  const targetArtist = clean(artist);
  let score = 0;

  if (result.kind === "song") score += 20;
  if (resultTitle === targetTitle) score += 50;
  if (resultTitle.includes(targetTitle) || targetTitle.includes(resultTitle)) score += 20;
  if (targetArtist !== "unknown artist" && resultArtist === targetArtist) score += 40;
  if (targetArtist !== "unknown artist" && (resultArtist.includes(targetArtist) || targetArtist.includes(resultArtist))) score += 15;

  return score;
}

async function enrichFromITunes(title: string, artist: string) {
  const term = artist === "Unknown artist" ? title : `${title} ${artist}`;
  const response = await fetchJson<ITunesSearchResponse>(
    `https://itunes.apple.com/search?media=music&entity=song&limit=10&term=${encodeURIComponent(term)}`
  );

  return response.results
    .filter((result) => result.kind === "song" && result.trackName && result.artistName)
    .sort((a, b) => scoreITunesResult(b, title, artist) - scoreITunesResult(a, title, artist))[0];
}

export class SpotifyAdapter implements MusicPlatformAdapter {
  provider = "spotify" as const;

  async fetchMetadata(url: string): Promise<TrackMetadata> {
    const externalId = parseSpotifyTrackId(url);
    const token = await getSpotifyToken().catch((error) => {
      if (error instanceof AdapterConfigurationError) {
        return null;
      }

      throw error;
    });

    if (!token) {
      return fetchSpotifyOEmbed(url, externalId);
    }

    const track = await fetchJson<SpotifyTrackResponse>(`https://api.spotify.com/v1/tracks/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const artistIds = track.artists.map((artist) => artist.id).join(",");
    const artists = artistIds
      ? await fetchJson<SpotifyArtistsResponse>(`https://api.spotify.com/v1/artists?ids=${artistIds}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      : { artists: [] };

    const genres = Array.from(new Set(artists.artists.flatMap((artist) => artist.genres)));

    return {
      provider: this.provider,
      externalId: track.id,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      genre: genres,
      coverUrl: track.album.images.sort((a, b) => b.width - a.width)[0]?.url,
      releaseDate: track.album.release_date,
      durationMs: track.duration_ms,
      platformUrl: track.external_urls.spotify,
      raw: track
    };
  }

  async syncAnalytics(externalId: string): Promise<AnalyticsSyncResult> {
    const token = await getSpotifyToken().catch((error) => {
      if (error instanceof AdapterConfigurationError) {
        return null;
      }

      throw error;
    });

    if (!token) {
      return {
        provider: this.provider,
        externalId,
        metrics: [{ name: "spotify_free_mode", value: 1, capturedAt: new Date() }],
        raw: { mode: "free" }
      };
    }
    const track = await fetchJson<SpotifyTrackResponse>(`https://api.spotify.com/v1/tracks/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      provider: this.provider,
      externalId,
      metrics: [{ name: "spotify_popularity", value: track.popularity, capturedAt: new Date() }],
      raw: track
    };
  }
}
