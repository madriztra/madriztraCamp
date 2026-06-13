import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireApiSession } from "@/lib/api";
import { launchCampaign } from "@/lib/campaigns";

const schema = z.object({
  songId: z.string().min(1),
  durationDays: z.number().int().min(1).max(90),
  startDate: z.string().datetime().optional()
});

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Invalid campaign launch payload");
  }

  try {
    const result = await launchCampaign({
      userId: session.user.id,
      songId: parsed.data.songId,
      durationDays: parsed.data.durationDays,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Campaign launch failed");
  }
}
