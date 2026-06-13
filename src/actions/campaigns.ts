"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import { launchCampaign } from "@/lib/campaigns";

export type CampaignActionState = {
  ok: boolean;
  message: string;
};

const launchSchema = z.object({
  songId: z.string().min(1),
  duration: z.enum(["7", "14", "30", "custom"]),
  customDays: z.coerce.number().int().min(1).max(90).optional()
});

export async function launchCampaignAction(
  _: CampaignActionState,
  formData: FormData
): Promise<CampaignActionState> {
  const session = await requireSession();
  const parsed = launchSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Choose a song and campaign duration." };
  }

  const durationDays =
    parsed.data.duration === "custom" ? (parsed.data.customDays ?? 14) : Number(parsed.data.duration);

  try {
    const { campaign, posts } = await launchCampaign({
      userId: session.user.id,
      songId: parsed.data.songId,
      durationDays
    });

    revalidatePath("/campaigns");
    revalidatePath("/scheduler");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `${campaign.name} launched with ${posts.length} scheduled posts.`
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Campaign launch failed."
    };
  }
}
