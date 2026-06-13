import type { Metadata } from "next";
import { MousePointerClick, Share2, Sparkles, Users, Waves } from "lucide-react";

import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { DeviceChart } from "@/components/charts/device-chart";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { GrowthChart } from "@/components/charts/growth-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary } from "@/lib/analytics";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Analytics"
};

export default async function AnalyticsPage() {
  const session = await requireSession();
  const summary = await getAnalyticsSummary(session.user.id, 90);

  return (
    <div>
      <PageHeader title="Analytics" description="Measure streams, clicks, saves, shares, followers, geo, devices, and funnel health." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Streams" value={summary.cards.streams} icon={Waves} accent="text-emerald-300" />
        <MetricCard label="Clicks" value={summary.cards.clicks} icon={MousePointerClick} accent="text-cyan-300" />
        <MetricCard label="Saves" value={summary.cards.saves} icon={Sparkles} />
        <MetricCard label="Shares" value={summary.cards.shares} icon={Share2} accent="text-amber-300" />
        <MetricCard label="Followers" value={summary.cards.followers} icon={Users} accent="text-pink-300" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daily / Weekly / Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthChart data={summary.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Views to Streams Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={summary.funnel} />
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Geo Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.geo.map((row) => (
              <div key={`${row._id.country}-${row._id.city}`} className="flex items-center justify-between text-sm">
                <span>{row._id.city || "Unknown"}, {row._id.country || "Unknown"}</span>
                <span className="text-muted-foreground">{row.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Device Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceChart data={summary.devices} />
          </CardContent>
        </Card>
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
      </div>
    </div>
  );
}
