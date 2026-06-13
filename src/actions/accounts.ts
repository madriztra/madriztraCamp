"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { ConnectedAccount } from "@/models/ConnectedAccount";

export type AccountActionState = {
  ok: boolean;
  message: string;
};

const accountSchema = z.object({
  provider: z.enum(["spotify", "youtube", "soundcloud", "appleMusic", "instagram", "tiktok"]),
  accountId: z.string().min(2).max(200),
  displayName: z.string().min(2).max(200),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  scopes: z.string().optional()
});

export async function saveConnectedAccount(
  _: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireSession();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid account data." };
  }

  await connectToDatabase();

  await ConnectedAccount.findOneAndUpdate(
    {
      userId: session.user.id,
      provider: parsed.data.provider,
      accountId: parsed.data.accountId
    },
    {
      userId: session.user.id,
      provider: parsed.data.provider,
      accountId: parsed.data.accountId,
      displayName: parsed.data.displayName,
      accessTokenEncrypted: parsed.data.accessToken ? encryptSecret(parsed.data.accessToken) : undefined,
      refreshTokenEncrypted: parsed.data.refreshToken ? encryptSecret(parsed.data.refreshToken) : undefined,
      scopes: parsed.data.scopes
        ?.split(",")
        .map((scope) => scope.trim())
        .filter(Boolean),
      syncStatus: "healthy"
    },
    { upsert: true, new: true }
  );

  revalidatePath("/accounts");

  return { ok: true, message: "Connected account saved securely." };
}
