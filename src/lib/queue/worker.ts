import { Worker } from "bullmq";

import { connectToDatabase } from "@/lib/mongodb";
import { publishSocialPost, type PublishPayload, type PublishPlatform } from "@/lib/publishers";
import { getRedisConnection } from "@/lib/queue/connection";
import type { PublishPostJob } from "@/lib/queue/queues";
import { Analytics } from "@/models/Analytics";
import { Content } from "@/models/Content";
import { ScheduledPost } from "@/models/ScheduledPost";

const worker = new Worker<PublishPostJob>(
  "scheduled-posts",
  async (job) => {
    await connectToDatabase();

    const post = await ScheduledPost.findById(job.data.scheduledPostId);

    if (!post) {
      throw new Error(`Scheduled post ${job.data.scheduledPostId} not found`);
    }

    post.attempts += 1;
    const result = await publishSocialPost({
      userId: post.userId.toString(),
      platform: post.platform as PublishPlatform,
      connectedAccountId: post.connectedAccountId?.toString(),
      payload: post.payload as PublishPayload
    });
    post.status = "published";
    post.publishedAt = new Date();
    post.lastError = undefined;
    post.payload = {
      ...(post.payload as Record<string, unknown>),
      providerResult: result
    };
    await post.save();

    await Content.findByIdAndUpdate(post.contentId, { status: "published" });
    await Analytics.create({
      userId: post.userId,
      songId: post.songId,
      campaignId: post.campaignId,
      platform: post.platform,
      eventType: "view",
      value: 1,
      source: "scheduler",
      occurredAt: new Date(),
      metadata: { scheduledPostId: post._id.toString() }
    });
  },
  { connection: getRedisConnection(), concurrency: 5 }
);

worker.on("failed", async (job, error) => {
  if (!job?.data?.scheduledPostId) {
    return;
  }

  await connectToDatabase();
  await ScheduledPost.findByIdAndUpdate(job.data.scheduledPostId, {
    status: "failed",
    lastError: error.message
  });
});

console.info("Music Growth OS scheduler worker started.");
