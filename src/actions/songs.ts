"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { createObjectKey, uploadBuffer } from "@/lib/s3";
import { seoFromSong } from "@/lib/seo/music";
import { createSmartLinkForSong, importSongFromUrl } from "@/lib/songs";
import { Song } from "@/models/Song";

export type SongActionState = {
  ok: boolean;
  message: string;
};

const importSchema = z.object({
  url: z.string().url()
});

const uploadSchema = z.object({
  title: z.string().min(1).max(180),
  artist: z.string().min(1).max(180),
  album: z.string().max(180).optional(),
  genre: z.string().max(220).optional(),
  releaseDate: z.string().optional(),
  spotify: z.string().url().optional().or(z.literal("")),
  appleMusic: z.string().url().optional().or(z.literal("")),
  soundCloud: z.string().url().optional().or(z.literal("")),
  youtubeMusic: z.string().url().optional().or(z.literal("")),
  deezer: z.string().url().optional().or(z.literal("")),
  amazonMusic: z.string().url().optional().or(z.literal(""))
});

function optionalFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
}

async function uploadFile(prefix: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const key = createObjectKey(prefix, file.name);

  return uploadBuffer({
    key,
    body: Buffer.from(arrayBuffer),
    contentType: file.type || "application/octet-stream"
  });
}

export async function importSpotifySong(_: SongActionState, formData: FormData): Promise<SongActionState> {
  const session = await requireSession();
  const parsed = importSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Enter a valid Spotify track URL." };
  }

  try {
    const song = await importSongFromUrl(session.user.id, parsed.data.url);
    await createSmartLinkForSong(session.user.id, song._id.toString(), song.title);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Spotify import failed." };
  }

  revalidatePath("/songs");
  revalidatePath("/smart-links");
  revalidatePath("/dashboard");

  return { ok: true, message: "Song imported and smart link created." };
}

export async function uploadSong(_: SongActionState, formData: FormData): Promise<SongActionState> {
  const session = await requireSession();
  const parsed = uploadSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid song data." };
  }

  const audioFile = optionalFile(formData, "audio");
  const coverFile = optionalFile(formData, "cover");

  if (!audioFile) {
    return { ok: false, message: "Upload an audio file." };
  }

  const [audioUrl, coverUrl] = await Promise.all([
    uploadFile(`songs/${session.user.id}/audio`, audioFile),
    coverFile ? uploadFile(`songs/${session.user.id}/covers`, coverFile) : Promise.resolve(undefined)
  ]);

  await connectToDatabase();

  const song = await Song.create({
    userId: session.user.id,
    title: parsed.data.title,
    artist: parsed.data.artist,
    album: parsed.data.album,
    genre: parsed.data.genre
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    releaseDate: parsed.data.releaseDate ? new Date(parsed.data.releaseDate) : undefined,
    audioUrl,
    coverUrl,
    source: "upload",
    platformUrls: {
      spotify: parsed.data.spotify || undefined,
      appleMusic: parsed.data.appleMusic || undefined,
      soundCloud: parsed.data.soundCloud || undefined,
      youtubeMusic: parsed.data.youtubeMusic || undefined,
      deezer: parsed.data.deezer || undefined,
      amazonMusic: parsed.data.amazonMusic || undefined
    },
    status: "ready"
  });

  song.seo = seoFromSong(song);
  await song.save();

  if (Object.values(song.platformUrls ?? {}).some(Boolean)) {
    await createSmartLinkForSong(session.user.id, song._id.toString(), song.title);
  }

  revalidatePath("/songs");
  revalidatePath("/smart-links");
  revalidatePath("/dashboard");

  return { ok: true, message: "Song uploaded successfully." };
}
