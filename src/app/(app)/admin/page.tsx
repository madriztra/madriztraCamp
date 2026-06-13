import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Analytics } from "@/models/Analytics";
import { Campaign } from "@/models/Campaign";
import { ScheduledPost } from "@/models/ScheduledPost";
import { SmartLink } from "@/models/SmartLink";
import { Song } from "@/models/Song";
import { User } from "@/models/User";
import { Activity, Link2, Megaphone, Music2, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin"
};

export default async function AdminPage() {
  const session = await requireSession();
  await connectToDatabase();
  const user = await User.findById(session.user.id).lean();

  if (user?.role !== "admin") {
    return (
      <div>
        <PageHeader title="Admin" description="Workspace administration is available to admin users." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Your account does not have admin access.</CardContent>
        </Card>
      </div>
    );
  }

  const [users, songs, campaigns, links, posts, analytics] = await Promise.all([
    User.countDocuments(),
    Song.countDocuments(),
    Campaign.countDocuments(),
    SmartLink.countDocuments(),
    ScheduledPost.countDocuments(),
    Analytics.countDocuments()
  ]);

  return (
    <div>
      <PageHeader title="Admin" description="System-wide visibility across users, songs, campaigns, links, jobs, and events." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Users" value={users} icon={Users} />
        <MetricCard label="Songs" value={songs} icon={Music2} accent="text-cyan-300" />
        <MetricCard label="Campaigns" value={campaigns} icon={Megaphone} accent="text-amber-300" />
        <MetricCard label="Links" value={links} icon={Link2} accent="text-emerald-300" />
        <MetricCard label="Posts" value={posts} icon={Activity} accent="text-pink-300" />
        <MetricCard label="Events" value={analytics} icon={Activity} accent="text-violet-300" />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Operational Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Run the BullMQ worker with npm run worker in production alongside the Next.js server.</p>
          <p>Use the CI workflow to typecheck, lint, and build each pull request before deployment.</p>
        </CardContent>
      </Card>
    </div>
  );
}
