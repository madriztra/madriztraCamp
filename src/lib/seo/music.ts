import { absoluteUrl } from "@/lib/env";
import type { SongDocument } from "@/models/Song";

type SeoInput = {
  title: string;
  artist: string;
  album?: string | null;
  coverUrl?: string | null;
  releaseDate?: Date | string | null;
  durationMs?: number | null;
  genre?: string[];
  slug?: string;
};

export function generateMusicSeo(input: SeoInput) {
  const title = `${input.title} by ${input.artist}`;
  const genreText = input.genre?.filter(Boolean).join(", ");
  const description = [
    `Listen to ${input.title} by ${input.artist}.`,
    input.album ? `From ${input.album}.` : undefined,
    genreText ? `For fans of ${genreText}.` : undefined
  ]
    .filter(Boolean)
    .join(" ");
  const keywords = Array.from(
    new Set([
      input.title,
      input.artist,
      input.album,
      ...(input.genre ?? []),
      "new music",
      "independent artist",
      "music smart link"
    ].filter(Boolean) as string[])
  );
  const url = input.slug ? absoluteUrl(`/listen/${input.slug}`) : absoluteUrl("/");

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      image: input.coverUrl,
      type: "music.song",
      url
    },
    twitterCard: {
      card: "summary_large_image",
      title,
      description,
      image: input.coverUrl
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      name: input.title,
      byArtist: {
        "@type": "MusicGroup",
        name: input.artist
      },
      inAlbum: input.album
        ? {
            "@type": "MusicAlbum",
            name: input.album
          }
        : undefined,
      datePublished: input.releaseDate ? new Date(input.releaseDate).toISOString() : undefined,
      duration: input.durationMs ? `PT${Math.round(input.durationMs / 1000)}S` : undefined,
      genre: input.genre,
      image: input.coverUrl,
      url
    }
  };
}

export function seoFromSong(song: SongDocument, slug?: string) {
  return generateMusicSeo({
    title: song.title,
    artist: song.artist,
    album: song.album,
    coverUrl: song.coverUrl,
    releaseDate: song.releaseDate,
    durationMs: song.durationMs,
    genre: song.genre,
    slug
  });
}
