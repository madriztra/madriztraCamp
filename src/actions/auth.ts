"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { createSecureToken, hashPassword, hashToken } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/mail";
import { requireSession } from "@/lib/auth";
import { User } from "@/models/User";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128)
});

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  artistName: z.string().max(120).optional(),
  labelName: z.string().max(120).optional(),
  primaryGenre: z.string().max(80).optional(),
  timezone: z.string().max(80).default("UTC"),
  website: z.string().url().optional().or(z.literal(""))
});

export type ActionState = {
  ok: boolean;
  message: string;
};

export async function registerUser(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid registration data" };
  }

  await connectToDatabase();

  const existingUser = await User.exists({ email: parsed.data.email.toLowerCase() });

  if (existingUser) {
    return { ok: false, message: "An account already exists for this email." };
  }

  await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    profile: {
      artistName: parsed.data.name,
      timezone: "UTC"
    }
  });

  redirect("/login?registered=1");
}

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  await connectToDatabase();

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select(
    "+passwordResetTokenHash +passwordResetExpires"
  );

  if (user) {
    const token = createSecureToken();
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(user.email, token);
  }

  return {
    ok: true,
    message: "If that email exists, a secure reset link has been sent."
  };
}

export async function resetPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid reset request" };
  }

  await connectToDatabase();

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(parsed.data.token),
    passwordResetExpires: { $gt: new Date() }
  }).select("+passwordHash +passwordResetTokenHash +passwordResetExpires");

  if (!user) {
    return { ok: false, message: "This reset link is invalid or expired." };
  }

  user.passwordHash = await hashPassword(parsed.data.password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { ok: true, message: "Password updated. You can now sign in." };
}

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid profile data" };
  }

  await connectToDatabase();

  await User.findByIdAndUpdate(session.user.id, {
    name: parsed.data.name,
    profile: {
      artistName: parsed.data.artistName,
      labelName: parsed.data.labelName,
      primaryGenre: parsed.data.primaryGenre,
      timezone: parsed.data.timezone,
      website: parsed.data.website || undefined
    }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { ok: true, message: "Profile updated." };
}
