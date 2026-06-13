import type { Metadata } from "next";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { ImportSongForm, UploadSongForm } from "@/components/forms/song-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/lib/utils";
import { Song } from "@/models/Song";

export const metadata: Metadata = {
  title: "Songs"
};

export default async function SongsPage() {
  const session = await requireSession();
  await connectToDatabase();
  const songs = await Song.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();

  return (
    <div>
      <PageHeader title="Songs" description="Upload masters and covers, or import Spotify metadata into your catalog." />
      <div className="grid gap-4 xl:grid-cols-2">
        <ImportSongForm />
        <UploadSongForm />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {songs.length === 0 ? (
            <EmptyState title="No songs yet" description="Import a Spotify URL or upload an audio file to start." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3">Song</th>
                    <th className="py-3">Source</th>
                    <th className="py-3">Genre</th>
                    <th className="py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {songs.map((song) => (
                    <tr key={song._id.toString()}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {song.coverUrl ? (
                            <img src={song.coverUrl} alt="" className="h-11 w-11 rounded-md object-cover" />
                          ) : (
                            <div className="h-11 w-11 rounded-md bg-secondary" />
                          )}
                          <div>
                            <p className="font-medium">{song.title}</p>
                            <p className="text-xs text-muted-foreground">{song.artist}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge>{song.source}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{song.genre?.join(", ") || "Uncategorized"}</td>
                      <td className="py-3 text-muted-foreground">{formatDateTime(song.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
