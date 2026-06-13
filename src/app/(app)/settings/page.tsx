import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "@/components/forms/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const metadata: Metadata = {
  title: "Settings"
};

const envChecks = [
  ["MongoDB", "MONGODB_URI"],
  ["Redis", "REDIS_URL"],
  ["S3", "S3_BUCKET"],
  ["OpenAI", "OPENAI_API_KEY"],
  ["Spotify", "SPOTIFY_CLIENT_ID"],
  ["Google Login", "GOOGLE_CLIENT_ID"],
  ["SMTP", "SMTP_HOST"]
];

export default async function SettingsPage() {
  const session = await requireSession();
  await connectToDatabase();
  const user = await User.findById(session.user.id).lean();

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and production integration readiness." />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ProfileForm
          profile={{
            name: user?.name ?? "",
            artistName: user?.profile?.artistName ?? undefined,
            labelName: user?.profile?.labelName ?? undefined,
            primaryGenre: user?.profile?.primaryGenre ?? undefined,
            timezone: user?.profile?.timezone ?? undefined,
            website: user?.profile?.website ?? undefined
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {envChecks.map(([label, key]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-md bg-secondary/40 p-3 text-sm">
                <span>{label}</span>
                <Badge variant={process.env[key] ? "success" : "warning"}>{process.env[key] ? "configured" : "missing"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
