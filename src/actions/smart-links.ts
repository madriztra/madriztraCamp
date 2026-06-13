"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import { createSmartLinkForSong } from "@/lib/songs";

export type SmartLinkActionState = {
  ok: boolean;
  message: string;
};

const smartLinkSchema = z.object({
  songId: z.string().min(1),
  slug: z.string().max(80).optional()
});

export async function createSmartLinkAction(
  _: SmartLinkActionState,
  formData: FormData
): Promise<SmartLinkActionState> {
  const session = await requireSession();
  const parsed = smartLinkSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Choose a song for this smart link." };
  }

  try {
    const smartLink = await createSmartLinkForSong(session.user.id, parsed.data.songId, parsed.data.slug);
    revalidatePath("/smart-links");
    return { ok: true, message: `Smart link created at /listen/${smartLink.slug}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Smart link creation failed." };
  }
}
