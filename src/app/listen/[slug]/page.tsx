import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Headphones } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { connectToDatabase } from "@/lib/mongodb";
import { SmartLink } from "@/models/SmartLink";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const platformLabels: Record<string, string> = {
  spotify: "Spotify",
  appleMusic: "Apple Music",
  soundCloud: "SoundCloud",
  youtubeMusic: "YouTube Music",
  deezer: "Deezer",
  amazonMusic: "Amazon Music"
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const smartLink = await SmartLink.findOne({ slug, isActive: true }).lean();

  if (!smartLink) {
    return { title: "Song not found | Music Growth OS" };
  }

  return {
    title: smartLink.seo?.title ?? `${smartLink.title} by ${smartLink.artist}`,
    description: smartLink.seo?.description,
    keywords: smartLink.seo?.keywords,
    openGraph: {
      title: smartLink.seo?.openGraph?.title ?? smartLink.title,
      description: smartLink.seo?.openGraph?.description ?? smartLink.seo?.description,
      images: smartLink.coverUrl ? [{ url: smartLink.coverUrl }] : undefined,
      type: "music.song"
    },
    twitter: {
      card: "summary_large_image",
      title: smartLink.seo?.twitterCard?.title ?? smartLink.title,
      description: smartLink.seo?.twitterCard?.description ?? smartLink.seo?.description,
      images: smartLink.coverUrl ? [smartLink.coverUrl] : undefined
    }
  };
}

export default async function ListenPage({ params }: PageProps) {
  const { slug } = await params;
  await connectToDatabase();
  const smartLink = await SmartLink.findOne({ slug, isActive: true }).lean();

  if (!smartLink) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      {smartLink.seo?.jsonLd ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(smartLink.seo.jsonLd) }}
        />
      ) : null}
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <Card className="overflow-hidden">
          {smartLink.coverUrl ? (
            <img src={smartLink.coverUrl} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-secondary">
              <Headphones className="h-16 w-16 text-primary" />
            </div>
          )}
          <CardContent className="space-y-5 p-5">
            <div>
              <Badge>Listen now</Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-normal">{smartLink.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{smartLink.artist}</p>
            </div>
            <div className="space-y-2">
              {smartLink.platforms.map((platform) => (
                <Button key={platform.platform} asChild className="w-full justify-between" variant="secondary">
                  <Link href={`/api/smart-links/${smartLink.slug}/click?platform=${platform.platform}`}>
                    <span>{platformLabels[platform.platform] ?? platform.platform}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">Powered by Music Growth OS</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
