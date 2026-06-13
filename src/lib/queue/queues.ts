import { Queue } from "bullmq";
import type { HydratedDocument } from "mongoose";

import { getRedisConnection } from "@/lib/queue/connection";
import type { ScheduledPostDocument } from "@/models/ScheduledPost";

export type PublishPostJob = {
  scheduledPostId: string;
};

let postQueue: Queue<PublishPostJob, void, "publish-post"> | null = null;

function shouldUseRedisQueue() {
  return process.env.QUEUE_DRIVER === "redis";
}

export function getPostQueue(): Queue<PublishPostJob, void, "publish-post"> {
  if (postQueue) {
    return postQueue;
  }

  postQueue = new Queue<PublishPostJob, void, "publish-post">("scheduled-posts", {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 60000 },
      removeOnComplete: 1000,
      removeOnFail: 2000
    }
  });

  return postQueue;
}

export async function enqueueScheduledPost(post: HydratedDocument<ScheduledPostDocument>) {
  if (!shouldUseRedisQueue()) {
    post.bullJobId = `local:${post._id.toString()}`;
    post.status = "scheduled";
    await post.save();
    return null;
  }

  const delay = Math.max(0, new Date(post.scheduledFor).getTime() - Date.now());
  const job = await getPostQueue().add(
    "publish-post",
    { scheduledPostId: post._id.toString() },
    { delay, jobId: `scheduled-post:${post._id.toString()}` }
  );

  post.bullJobId = job.id;
  post.status = "scheduled";
  await post.save();

  return job;
}
