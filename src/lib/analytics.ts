import { subDays } from "date-fns";
import { Types } from "mongoose";
import { UAParser } from "ua-parser-js";

import { generatePerformanceInsights } from "@/lib/ai/insights";
import { connectToDatabase } from "@/lib/mongodb";
import { Analytics } from "@/models/Analytics";
import { Campaign } from "@/models/Campaign";
import { SmartLink } from "@/models/SmartLink";
import { Song } from "@/models/Song";

export function parseDevice(userAgent: string | null) {
  const parser = new UAParser(userAgent ?? "");
  const deviceType = parser.getDevice().type;

  if (deviceType === "mobile" || deviceType === "tablet") {
    return deviceType;
  }

  if (parser.getBrowser().name?.toLowerCase().includes("bot")) {
    return "bot";
  }

  return userAgent ? "desktop" : "unknown";
}

export async function recordSmartLinkClick(input: {
  slug: string;
  platform: string;
  source?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
  referrer?: string | null;
}) {
  await connectToDatabase();

  const smartLink = await SmartLink.findOne({ slug: input.slug, isActive: true });

  if (!smartLink) {
    return null;
  }

  const platform = smartLink.platforms.find((item) => item.platform === input.platform);

  if (!platform) {
    return null;
  }

  platform.clicks += 1;
  smartLink.clickCount += 1;
  await smartLink.save();

  await Analytics.create({
    userId: smartLink.userId,
    songId: smartLink.songId,
    smartLinkId: smartLink._id,
    platform: input.platform,
    eventType: "click",
    value: 1,
    source: input.source ?? input.referrer ?? "direct",
    country: input.country ?? "Unknown",
    city: input.city ?? "Unknown",
    device: parseDevice(input.userAgent ?? null),
    occurredAt: new Date(),
    metadata: {
      userAgent: input.userAgent,
      referrer: input.referrer
    }
  });

  return platform.url;
}

async function eventTotals(userId: string, since: Date) {
  const userObjectId = new Types.ObjectId(userId);
  const rows = await Analytics.aggregate<{ _id: string; total: number }>([
    { $match: { userId: userObjectId, occurredAt: { $gte: since } } },
    { $group: { _id: "$eventType", total: { $sum: "$value" } } }
  ]);

  return Object.fromEntries(rows.map((row) => [row._id, row.total]));
}

export async function getAnalyticsSummary(userId: string, days = 30) {
  await connectToDatabase();

  const since = subDays(new Date(), days);
  const userObjectId = new Types.ObjectId(userId);
  const totals = await eventTotals(userId, since);

  const [daily, geo, devices, platform, campaigns, songs] = await Promise.all([
    Analytics.aggregate<{ date: string; views: number; clicks: number; streams: number }>([
      { $match: { userId: userObjectId, occurredAt: { $gte: since } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
            eventType: "$eventType"
          },
          total: { $sum: "$value" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          metrics: { $push: { k: "$_id.eventType", v: "$total" } }
        }
      },
      { $project: { _id: 0, date: "$_id", metrics: { $arrayToObject: "$metrics" } } },
      {
        $project: {
          date: 1,
          views: { $ifNull: ["$metrics.view", 0] },
          clicks: { $ifNull: ["$metrics.click", 0] },
          streams: { $ifNull: ["$metrics.stream", 0] }
        }
      },
      { $sort: { date: 1 } }
    ]),
    Analytics.aggregate<{ _id: { country: string; city: string }; total: number }>([
      { $match: { userId: userObjectId, occurredAt: { $gte: since } } },
      { $group: { _id: { country: "$country", city: "$city" }, total: { $sum: "$value" } } },
      { $sort: { total: -1 } },
      { $limit: 12 }
    ]),
    Analytics.aggregate<{ _id: string; total: number }>([
      { $match: { userId: userObjectId, occurredAt: { $gte: since } } },
      { $group: { _id: "$device", total: { $sum: "$value" } } },
      { $sort: { total: -1 } }
    ]),
    Analytics.aggregate<{ _id: string; total: number }>([
      { $match: { userId: userObjectId, occurredAt: { $gte: since } } },
      { $group: { _id: "$platform", total: { $sum: "$value" } } },
      { $sort: { total: -1 } }
    ]),
    Campaign.countDocuments({ userId }),
    Song.countDocuments({ userId })
  ]);

  const insightData = { totals, daily, geo, devices, platform, campaigns, songs };
  const insights = await generatePerformanceInsights(insightData);

  return {
    cards: {
      streams: totals.stream ?? 0,
      clicks: totals.click ?? 0,
      saves: totals.save ?? 0,
      shares: totals.share ?? 0,
      followers: totals.follow ?? 0
    },
    funnel: {
      views: totals.view ?? 0,
      clicks: totals.click ?? 0,
      streams: totals.stream ?? 0
    },
    daily,
    geo,
    devices,
    platform,
    campaigns,
    songs,
    insights
  };
}
