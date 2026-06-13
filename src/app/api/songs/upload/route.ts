export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireApiSession } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { createObjectKey, uploadBuffer } from "@/lib/s3";
import { seoFromSong } from "@/lib/seo/music";
import { createSmartLinkForSong } from "@/lib/songs";
import { Song } from "@/models/Song";

const schema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().optional(),
  genre: z.string().optional()
});

async function uploadFile(
  prefix: string,
  file: File
) {
  const key = createObjectKey(
    prefix,
    file.name
  );

  const body = Buffer.from(
    await file.arrayBuffer()
  );

  return uploadBuffer({
    key,
    body,
    contentType:
      file.type ||
      "application/octet-stream",
  });
}

export async function POST(
  request: Request
) {
  try {
    const { session, response } =
      await requireApiSession();

    if (response) {
      return response;
    }

    const formData =
      await request.formData();

    const parsed = schema.safeParse(
      Object.fromEntries(formData)
    );

    const audio =
      formData.get("audio");

    const cover =
      formData.get("cover");

    if (
      !parsed.success ||
      !(audio instanceof File)
    ) {
      return jsonError(
        "Title, artist, and audio file are required"
      );
    }

    console.log(
      "Uploading audio:",
      audio.name
    );

    console.log(
      "Audio size:",
      audio.size
    );

    let audioUrl: string;
    let coverUrl:
      | string
      | undefined;

    try {
      [audioUrl, coverUrl] =
        await Promise.all([
          uploadFile(
            `songs/${session.user.id}/audio`,
            audio
          ),

          cover instanceof File &&
          cover.size > 0
            ? uploadFile(
                `songs/${session.user.id}/covers`,
                cover
              )
            : Promise.resolve(
                undefined
              ),
        ]);
    } catch (uploadError) {
      console.error(
        "R2 UPLOAD ERROR:",
        uploadError
      );

      return NextResponse.json(
        {
          success: false,
          stage: "upload",
          error:
            uploadError instanceof Error
              ? uploadError.message
              : String(
                  uploadError
                ),
        },
        {
          status: 500,
        }
      );
    }

    await connectToDatabase();

    let song;

    try {
      song = await Song.create({
        userId: session.user.id,
        title: parsed.data.title,
        artist:
          parsed.data.artist,
        album:
          parsed.data.album,
        genre:
          parsed.data.genre
            ?.split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        audioUrl,
        coverUrl,
        source: "upload",
        status: "ready",
      });
    } catch (dbError) {
      console.error(
        "DATABASE ERROR:",
        dbError
      );

      return NextResponse.json(
        {
          success: false,
          stage: "database",
          error:
            dbError instanceof Error
              ? dbError.message
              : String(dbError),
        },
        {
          status: 500,
        }
      );
    }

    try {
      song.seo =
        seoFromSong(song);

      await song.save();
    } catch (seoError) {
      console.error(
        "SEO ERROR:",
        seoError
      );
    }

    let smartLink = null;

    try {
      smartLink =
        await createSmartLinkForSong(
          session.user.id,
          song._id.toString(),
          song.title
        );
    } catch (
      smartLinkError
    ) {
      console.error(
        "SMART LINK ERROR:",
        smartLinkError
      );
    }

    return NextResponse.json(
      {
        success: true,
        song,
        smartLink,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "UPLOAD ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        stage: "unknown",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
