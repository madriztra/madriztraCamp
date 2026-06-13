import { adapterForUrl, type TrackMetadata } from "@/lib/adapters";
import { connectToDatabase } from "@/lib/mongodb";
import { seoFromSong } from "@/lib/seo/music";
import { Song } from "@/models/Song";
import { SmartLink } from "@/models/SmartLink";
import { slugify } from "@/lib/slug";

function platformUrlPatch(metadata: TrackMetadata) {
  if (metadata.provider === "spotify") {
    return { spotify: metadata.platformUrl };
  }

  if (metadata.provider === "youtube") {
    return { youtubeMusic: metadata.platformUrl };
  }

  if (metadata.provider === "soundcloud") {
    return { soundCloud: metadata.platformUrl };
  }

  if (metadata.provider === "appleMusic") {
    return { appleMusic: metadata.platformUrl };
  }

  return {};
}

function externalIdPatch(metadata: TrackMetadata) {
  if (metadata.provider === "appleMusic") {
    return { appleMusic: metadata.externalId };
  }

  return { [metadata.provider]: metadata.externalId };
}

export async function importSongFromUrl(userId: string, url: string) {
  const adapter = adapterForUrl(url);
  const metadata = await adapter.fetchMetadata(url);

  await connectToDatabase();

  const song = await Song.create({
    userId,
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    genre: metadata.genre,
    releaseDate: metadata.releaseDate ? new Date(metadata.releaseDate) : undefined,
    durationMs: metadata.durationMs,
    coverUrl: metadata.coverUrl,
    source: metadata.provider === "appleMusic" ? "apple" : metadata.provider,
    externalIds: externalIdPatch(metadata),
    platformUrls: platformUrlPatch(metadata),
    status: "ready"
  });

  song.seo = seoFromSong(song);
  await song.save();

  return song;
}

export async function createSmartLinkForSong(userId: string, songId: string, preferredSlug?: string) {
  await connectToDatabase();
  const song = await Song.findOne({ _id: songId, userId });

  if (!song) {
    throw new Error("Song not found");
  }

  const platformEntries = Object.entries(song.platformUrls ?? {})
    .filter(([, url]) => typeof url === "string" && url.length > 0)
    .map(([platform, url]) => ({ platform, url }));

  if (platformEntries.length === 0) {
    throw new Error("Add at least one streaming platform URL before creating a smart link.");
  }

  const slugBase = slugify(preferredSlug || `${song.title}`) || slugify(`${song.artist}-${song.title}`) || "listen";
  let slug = slugBase;
  let suffix = 2;

  while (await SmartLink.exists({ slug })) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  const seo = seoFromSong(song, slug);

  const smartLink = await SmartLink.create({
    userId,
    songId: song._id,
    slug,
    title: song.title,
    artist: song.artist,
    coverUrl: song.coverUrl,
    platforms: platformEntries,
    seo
  });

  song.seo = seoFromSong(song, slug);
  await song.save();

  return smartLink;
}
