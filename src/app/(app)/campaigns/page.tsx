import type { Metadata } from "next";
import { Types } from "mongoose";

import { PageHeader } from "@/components/app/page-header";
import { LaunchCampaignForm } from "@/components/forms/campaign-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/lib/utils";
import { Campaign } from "@/models/Campaign";
import { Content } from "@/models/Content";
import { Song } from "@/models/Song";

export const metadata: Metadata = {
  title: "Campaigns"
};

export default async function CampaignsPage() {
  const session = await requireSession();
  await connectToDatabase();

  const [songs, campaigns] = await Promise.all([
    Song.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
    Campaign.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean()
  ]);
  const contentCounts = await Content.aggregate<{ _id: string; total: number }>([
    { $match: { userId: new Types.ObjectId(session.user.id) } },
    { $group: { _id: "$campaignId", total: { $sum: 1 } } }
  ]);
  const countMap = new Map(contentCounts.map((item) => [String(item._id), item.total]));

  return (
    <div>
      <PageHeader title="Campaigns" description="Launch AI-generated growth campaigns with content plans and schedules." />
      <LaunchCampaignForm songs={songs.map((song) => ({ id: song._id.toString(), title: song.title, artist: song.artist }))} />

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign._id.toString()}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{campaign.name}</CardTitle>
                <Badge variant={campaign.status === "active" ? "success" : "secondary"}>{campaign.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-secondary/40 p-3">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="mt-1 font-medium">{campaign.durationDays} days</p>
                </div>
                <div className="rounded-md bg-secondary/40 p-3">
                  <p className="text-muted-foreground">Content</p>
                  <p className="mt-1 font-medium">{countMap.get(campaign._id.toString()) ?? 0} ideas</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{campaign.contentPlan?.positioning}</p>
              <div className="flex flex-wrap gap-2">
                {campaign.contentPlan?.creativeThemes?.map((theme) => (
                  <Badge key={theme} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Launched {formatDateTime(campaign.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
