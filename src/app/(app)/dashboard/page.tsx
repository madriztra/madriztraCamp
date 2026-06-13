import type { Metadata } from "next";
import { BarChart3, MousePointerClick, Share2, Sparkles, Users, Waves } from "lucide-react";

import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { DeviceChart } from "@/components/charts/device-chart";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { GrowthChart } from "@/components/charts/growth-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary } from "@/lib/analytics";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/lib/utils";
import { Campaign } from "@/models/Campaign";
import { ScheduledPost } from "@/models/ScheduledPost";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default async function DashboardPage() {
  const session = await requireSession();
  const summary = await getAnalyticsSummary(session.user.id, 30);

  await connectToDatabase();
  const [campaigns, posts] = await Promise.all([
    Campaign.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(4).lean(),
    ScheduledPost.find({ userId: session.user.id }).sort({ scheduledFor: 1 }).limit(5).lean()
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your operating system for releases, campaigns, links, scheduling, and performance."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Streams" value={summary.cards.streams} icon={Waves} accent="text-emerald-300" />
        <MetricCard label="Clicks" value={summary.cards.clicks} icon={MousePointerClick} accent="text-cyan-300" />
        <MetricCard label="Saves" value={summary.cards.saves} icon={Sparkles} />
        <MetricCard label="Shares" value={summary.cards.shares} icon={Share2} accent="text-amber-300" />
        <MetricCard label="Followers" value={summary.cards.followers} icon={Users} accent="text-pink-300" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={summary.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={summary.funnel} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.insights.map((insight) => (
              <div key={insight} className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
                {insight}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Device Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceChart data={summary.devices} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {posts.map((post) => (
              <div key={post._id.toString()} className="flex items-center justify-between gap-3 rounded-md bg-secondary/40 p-3">
                <div>
                  <p className="text-sm font-medium">{post.platform}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(post.scheduledFor)}</p>
                </div>
                <Badge variant={post.status === "failed" ? "destructive" : "default"}>{post.status}</Badge>
              </div>
            ))}
            {posts.length === 0 ? <p className="text-sm text-muted-foreground">No scheduled posts yet.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <div key={campaign._id.toString()} className="rounded-md border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{campaign.name}</p>
                <Badge variant={campaign.status === "active" ? "success" : "secondary"}>{campaign.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {campaign.durationDays} days · {formatDateTime(campaign.startDate)}
              </p>
            </div>
          ))}
          {campaigns.length === 0 ? <p className="text-sm text-muted-foreground">Launch a campaign to see it here.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
