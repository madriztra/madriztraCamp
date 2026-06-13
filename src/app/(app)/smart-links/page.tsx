import Link from "next/link";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { SmartLinkForm } from "@/components/forms/smart-link-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SmartLink } from "@/models/SmartLink";
import { Song } from "@/models/Song";

export const metadata: Metadata = {
  title: "Smart Links"
};

export default async function SmartLinksPage() {
  const session = await requireSession();
  await connectToDatabase();
  const [songs, links] = await Promise.all([
    Song.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
    SmartLink.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean()
  ]);

  return (
    <div>
      <PageHeader title="Smart Links" description="Create /listen pages that track platform clicks, source, device, and country." />
      <SmartLinkForm songs={songs.map((song) => ({ id: song._id.toString(), title: song.title, artist: song.artist }))} />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {links.map((link) => (
          <Card key={link._id.toString()}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{link.title}</CardTitle>
                <Badge>{link.clickCount} clicks</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {link.coverUrl ? <img src={link.coverUrl} alt="" className="h-14 w-14 rounded-md object-cover" /> : null}
                <div>
                  <p className="font-medium">{link.artist}</p>
                  <p className="text-sm text-muted-foreground">/listen/{link.slug}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {link.platforms.map((platform) => (
                  <Badge key={platform.platform} variant="secondary">
                    {platform.platform}: {platform.clicks}
                  </Badge>
                ))}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/listen/${link.slug}`}>Open listen page</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
