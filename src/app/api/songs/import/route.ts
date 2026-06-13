import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireApiSession } from "@/lib/api";
import { createSmartLinkForSong, importSongFromUrl } from "@/lib/songs";

const schema = z.object({
  url: z.string().url(),
  createSmartLink: z.boolean().default(true)
});

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Invalid import payload");
  }

  try {
    const song = await importSongFromUrl(session.user.id, parsed.data.url);
    const smartLink = parsed.data.createSmartLink
      ? await createSmartLinkForSong(session.user.id, song._id.toString(), song.title)
      : null;

    return NextResponse.json({ song, smartLink }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Song import failed");
  }
}
