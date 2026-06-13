export type MusicProvider = "spotify" | "youtube" | "soundcloud" | "appleMusic";

export type TrackMetadata = {
  provider: MusicProvider;
  externalId: string;
  title: string;
  artist: string;
  album?: string;
  genre: string[];
  coverUrl?: string;
  releaseDate?: string;
  durationMs?: number;
  platformUrl: string;
  raw?: unknown;
};

export type ProviderMetric = {
  name: string;
  value: number;
  capturedAt: Date;
};

export type AnalyticsSyncResult = {
  provider: MusicProvider;
  externalId: string;
  metrics: ProviderMetric[];
  raw?: unknown;
};

export interface MusicPlatformAdapter {
  provider: MusicProvider;
  fetchMetadata(url: string): Promise<TrackMetadata>;
  syncAnalytics(externalId: string): Promise<AnalyticsSyncResult>;
}

export class AdapterConfigurationError extends Error {
  constructor(provider: MusicProvider, envName: string) {
    super(`${provider} adapter requires ${envName}`);
    this.name = "AdapterConfigurationError";
  }
}
