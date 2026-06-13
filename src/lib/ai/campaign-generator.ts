import { addDays, setHours, setMinutes } from "date-fns";
import { z } from "zod";

import { generateJson } from "@/lib/ai/openai";
import type { SongDocument } from "@/models/Song";

const platforms = ["tiktok", "instagram", "youtube_shorts"] as const;

export type GeneratedContentIdea = {
  platform: (typeof platforms)[number];
  idea: string;
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  creativeDirection: string;
  dayOffset: number;
  hour: number;
};

export type GeneratedCampaignPlan = {
  campaignName: string;
  contentPlan: {
    audience: string;
    positioning: string;
    postingCadence: string;
    creativeThemes: string[];
    recommendedWindows: string[];
  };
  goals: {
    streams: number;
    clicks: number;
    saves: number;
    followers: number;
  };
  insights: string[];
  ideas: GeneratedContentIdea[];
};

const generatedIdeaSchema = z.object({
  platform: z.enum(platforms),
  idea: z.string().min(8),
  hook: z.string().min(4),
  caption: z.string().min(10),
  hashtags: z.array(z.string()).min(3).max(12),
  cta: z.string().min(4),
  creativeDirection: z.string().min(8),
  dayOffset: z.number().int().min(0),
  hour: z.number().int().min(0).max(23)
});

const generatedPlanSchema = z.object({
  campaignName: z.string().min(4),
  contentPlan: z.object({
    audience: z.string(),
    positioning: z.string(),
    postingCadence: z.string(),
    creativeThemes: z.array(z.string()).min(3),
    recommendedWindows: z.array(z.string()).min(2)
  }),
  goals: z.object({
    streams: z.number().int().min(0),
    clicks: z.number().int().min(0),
    saves: z.number().int().min(0),
    followers: z.number().int().min(0)
  }),
  insights: z.array(z.string()).min(3),
  ideas: z.array(generatedIdeaSchema).min(30)
});

function normalizeHashtag(value: string) {
  const cleaned = value.replace(/^#/, "").replace(/[^A-Za-z0-9]/g, "");
  return cleaned ? `#${cleaned}` : undefined;
}

function fallbackIdeas(song: SongDocument, durationDays: number): GeneratedContentIdea[] {
  const genre = song.genre?.[0] ?? "indie music";
  const themes = [
    "lyric reaction",
    "studio breakdown",
    "story behind the hook",
    "fan POV",
    "visual moodboard",
    "duet prompt",
    "chorus reveal",
    "artist confession",
    "release countdown",
    "playlist pitch"
  ];

  return Array.from({ length: 30 }, (_, index) => {
    const platform = platforms[index % platforms.length];
    const theme = themes[index % themes.length];
    const dayOffset = index % Math.max(durationDays, 1);
    const hour = [18, 19, 20][index % 3];
    const baseTags = [song.artist, song.title, genre, "newmusic", "independentartist"]
      .map(normalizeHashtag)
      .filter(Boolean) as string[];

    return {
      platform,
      idea: `${theme} for "${song.title}" with a ${genre} angle`,
      hook: `This part of "${song.title}" hits different`,
      caption: `${song.title} by ${song.artist} is built for the moment when ${theme.replace("artist ", "")}.`,
      hashtags: Array.from(new Set(baseTags)).slice(0, 8),
      cta: "Tap the smart link and save the track.",
      creativeDirection: `Open with a close, human moment, cut to the strongest hook, and end on the cover art.`,
      dayOffset,
      hour
    };
  });
}

export function scheduledDate(startDate: Date, idea: Pick<GeneratedContentIdea, "dayOffset" | "hour">) {
  return setMinutes(setHours(addDays(startDate, idea.dayOffset), idea.hour), idea.hour === 20 ? 15 : 0);
}

export async function generateCampaignPlan(song: SongDocument, durationDays: number): Promise<GeneratedCampaignPlan> {
  const fallback = fallbackIdeas(song, durationDays);
  const prompt = JSON.stringify({
    task:
      "Create a music marketing campaign plan with at least 30 short-form content ideas. Return JSON only.",
    song: {
      title: song.title,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      releaseDate: song.releaseDate,
      durationMs: song.durationMs
    },
    durationDays,
    platforms,
    requiredShape: {
      campaignName: "string",
      contentPlan: {
        audience: "string",
        positioning: "string",
        postingCadence: "string",
        creativeThemes: ["string"],
        recommendedWindows: ["18:00-20:00"]
      },
      goals: { streams: 0, clicks: 0, saves: 0, followers: 0 },
      insights: ["string"],
      ideas: fallback[0]
    }
  });

  const generated = await generateJson<GeneratedCampaignPlan>(
    "You are a senior music marketing strategist for independent artists. Write concrete, publishable campaign content, not generic advice.",
    prompt
  );

  const parsed = generatedPlanSchema.safeParse(generated);

  if (parsed.success) {
    const ideas = parsed.data.ideas.map((idea) => ({
      ...idea,
      dayOffset: Math.min(idea.dayOffset, Math.max(durationDays - 1, 0)),
      hashtags: idea.hashtags.map(normalizeHashtag).filter(Boolean) as string[]
    }));

    if (ideas.length >= 30) {
      return { ...parsed.data, ideas };
    }
  }

  return {
    campaignName: `${song.title} Growth Sprint`,
    contentPlan: {
      audience: `Fans of ${song.genre?.[0] ?? "independent music"} and short-form discovery.`,
      positioning: `${song.title} is positioned as a repeat-save track with emotional, hook-led short videos.`,
      postingCadence: `${Math.ceil(30 / Math.max(durationDays, 1))} posts per day across TikTok, Instagram Reels, and YouTube Shorts.`,
      creativeThemes: ["emotion-first hooks", "behind the song", "fan participation", "playlist saves"],
      recommendedWindows: ["18:00-20:00", "12:00-13:00"]
    },
    goals: {
      streams: durationDays * 1200,
      clicks: durationDays * 280,
      saves: durationDays * 140,
      followers: durationDays * 45
    },
    insights: [
      "Emotional hooks should lead the first two seconds.",
      "Posts between 18:00-20:00 are prioritized for discovery.",
      "Caption CTAs focus on saves before streams."
    ],
    ideas: fallback
  };
}
