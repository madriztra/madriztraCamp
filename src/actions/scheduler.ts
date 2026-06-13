"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { enqueueScheduledPost } from "@/lib/queue/queues";
import { ScheduledPost } from "@/models/ScheduledPost";

export type SchedulerActionState = {
  ok: boolean;
  message: string;
};

const retrySchema = z.object({
  postId: z.string().min(1)
});

const prepareSchema = z.object({
  postId: z.string().min(1),
  mediaUrl: z.string().url(),
  connectedAccountId: z.string().optional()
});

export async function prepareScheduledPost(
  _: SchedulerActionState,
  formData: FormData
): Promise<SchedulerActionState> {
  const session = await requireSession();
  const parsed = prepareSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Enter a public video URL for the scheduled post." };
  }

  await connectToDatabase();
  const post = await ScheduledPost.findOne({ _id: parsed.data.postId, userId: session.user.id });

  if (!post) {
    return { ok: false, message: "Scheduled post not found." };
  }

  post.connectedAccountId = parsed.data.connectedAccountId
    ? new Types.ObjectId(parsed.data.connectedAccountId)
    : undefined;
  post.payload = {
    ...(post.payload as Record<string, unknown>),
    mediaUrl: parsed.data.mediaUrl
  };
  post.status = "pending";
  post.lastError = undefined;

  try {
    await enqueueScheduledPost(post);
  } catch (error) {
    post.status = "failed";
    post.lastError = error instanceof Error ? error.message : "Queue scheduling failed";
    await post.save();
    return { ok: false, message: post.lastError };
  }

  revalidatePath("/scheduler");
  return { ok: true, message: "Creative attached and post queued." };
}

export async function retryScheduledPost(
  _: SchedulerActionState,
  formData: FormData
): Promise<SchedulerActionState> {
  const session = await requireSession();
  const parsed = retrySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Choose a failed post to retry." };
  }

  await connectToDatabase();

  const post = await ScheduledPost.findOne({ _id: parsed.data.postId, userId: session.user.id });

  if (!post) {
    return { ok: false, message: "Scheduled post not found." };
  }

  try {
    post.status = "pending";
    post.lastError = undefined;
    await enqueueScheduledPost(post);
  } catch (error) {
    post.status = "failed";
    post.lastError = error instanceof Error ? error.message : "Retry failed";
    await post.save();
    return { ok: false, message: post.lastError };
  }

  revalidatePath("/scheduler");

  return { ok: true, message: "Post queued for retry." };
}
