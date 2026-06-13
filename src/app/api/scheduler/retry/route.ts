import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireApiSession } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { enqueueScheduledPost } from "@/lib/queue/queues";
import { ScheduledPost } from "@/models/ScheduledPost";

const schema = z.object({
  postId: z.string().min(1)
});

export async function POST(request: Request) {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Invalid retry payload");
  }

  await connectToDatabase();
  const post = await ScheduledPost.findOne({ _id: parsed.data.postId, userId: session.user.id });

  if (!post) {
    return jsonError("Scheduled post not found", 404);
  }

  await enqueueScheduledPost(post);

  return NextResponse.json({ ok: true, postId: post._id.toString() });
}
