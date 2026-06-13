import { addDays } from "date-fns";

import { generateCampaignPlan, scheduledDate } from "@/lib/ai/campaign-generator";
import { connectToDatabase } from "@/lib/mongodb";
import { enqueueScheduledPost } from "@/lib/queue/queues";
import { Campaign } from "@/models/Campaign";
import { Content } from "@/models/Content";
import { ScheduledPost } from "@/models/ScheduledPost";
import { Song } from "@/models/Song";

export async function launchCampaign(input: {
  userId: string;
  songId: string;
  durationDays: number;
  startDate?: Date;
}) {
  const startDate = input.startDate ?? new Date();
  const endDate = addDays(startDate, input.durationDays);

  await connectToDatabase();

  const song = await Song.findOne({ _id: input.songId, userId: input.userId });

  if (!song) {
    throw new Error("Song not found");
  }

  const generated = await generateCampaignPlan(song, input.durationDays);

  const campaign = await Campaign.create({
    userId: input.userId,
    songId: song._id,
    name: generated.campaignName,
    durationDays: input.durationDays,
    startDate,
    endDate,
    status: "active",
    contentPlan: generated.contentPlan,
    goals: generated.goals,
    aiInsights: generated.insights,
    launchedAt: new Date()
  });

  const createdPosts = [];

  for (const idea of generated.ideas.slice(0, Math.max(30, generated.ideas.length))) {
    const scheduledFor = scheduledDate(startDate, idea);
    const content = await Content.create({
      userId: input.userId,
      songId: song._id,
      campaignId: campaign._id,
      platform: idea.platform,
      type: "idea",
      idea: idea.idea,
      hook: idea.hook,
      caption: idea.caption,
      hashtags: idea.hashtags,
      cta: idea.cta,
      creativeDirection: idea.creativeDirection,
      status: "scheduled",
      scheduledFor
    });

    const post = await ScheduledPost.create({
      userId: input.userId,
      songId: song._id,
      campaignId: campaign._id,
      contentId: content._id,
      platform: idea.platform,
      status: "pending",
      scheduledFor,
      payload: {
        caption: idea.caption,
        hashtags: idea.hashtags,
        cta: idea.cta,
        creativeDirection: idea.creativeDirection
      }
    });

    try {
      await enqueueScheduledPost(post);
    } catch (error) {
      post.status = "failed";
      post.lastError = error instanceof Error ? error.message : "Queue scheduling failed";
      await post.save();
    }

    createdPosts.push(post);
  }

  return { campaign, posts: createdPosts };
}
