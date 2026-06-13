import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { PreparePostForm } from "@/components/forms/prepare-post-form";
import { RetryPostButton } from "@/components/forms/retry-post-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/lib/utils";
import { ScheduledPost } from "@/models/ScheduledPost";
import { ConnectedAccount } from "@/models/ConnectedAccount";

export const metadata: Metadata = {
  title: "Scheduler"
};

export default async function SchedulerPage() {
  const session = await requireSession();
  await connectToDatabase();
  const [posts, connectedAccounts] = await Promise.all([
    ScheduledPost.find({ userId: session.user.id }).sort({ scheduledFor: 1 }).limit(120).lean(),
    ConnectedAccount.find({
      userId: session.user.id,
      provider: { $in: ["instagram", "tiktok", "youtube"] },
      syncStatus: "healthy"
    })
      .sort({ provider: 1, displayName: 1 })
      .lean()
  ]);
  const accountOptions = connectedAccounts.map((account) => ({
    id: account._id.toString(),
    label: `${account.provider} - ${account.displayName}`
  }));
  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const key = new Date(post.scheduledFor).toISOString().slice(0, 10);
    acc[key] ??= [];
    acc[key].push(post);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Scheduler" description="Calendar view for pending, scheduled, published, and failed posts." />
      <div className="grid gap-4 xl:grid-cols-3">
        {Object.entries(grouped).map(([date, datePosts]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle>{date}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {datePosts.map((post) => (
                <div key={post._id.toString()} className="rounded-md border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{post.platform}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(post.scheduledFor)}</p>
                    </div>
                    <Badge
                      variant={
                        post.status === "published"
                          ? "success"
                          : post.status === "failed"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {post.status}
                    </Badge>
                  </div>
                  {post.lastError ? <p className="mt-2 text-xs text-red-300">{post.lastError}</p> : null}
                  {post.status === "failed" ? (
                    <div className="mt-3 space-y-2">
                      <RetryPostButton postId={post._id.toString()} />
                      <PreparePostForm postId={post._id.toString()} accounts={accountOptions} />
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Launch a campaign to populate the calendar.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
