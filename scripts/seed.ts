import { addDays, subDays } from "date-fns";

import { hashPassword } from "../src/lib/password";
import { generateMusicSeo } from "../src/lib/seo/music";
import { connectToDatabase } from "../src/lib/mongodb";
import { Analytics } from "../src/models/Analytics";
import { Campaign } from "../src/models/Campaign";
import { ConnectedAccount } from "../src/models/ConnectedAccount";
import { Content } from "../src/models/Content";
import { ScheduledPost } from "../src/models/ScheduledPost";
import { SmartLink } from "../src/models/SmartLink";
import { Song } from "../src/models/Song";
import { User } from "../src/models/User";

async function seed() {
  await connectToDatabase();

  await Promise.all([
    Analytics.deleteMany({}),
    ScheduledPost.deleteMany({}),
    Content.deleteMany({}),
    Campaign.deleteMany({}),
    SmartLink.deleteMany({}),
    Song.deleteMany({}),
    ConnectedAccount.deleteMany({}),
    User.deleteMany({})
  ]);

  const user = await User.create({
    email: "admin@musicgrowthos.test",
    name: "Music Growth Admin",
    passwordHash: await hashPassword("ChangeMe123!"),
    role: "admin",
    profile: {
      artistName: "Nova Vale",
      primaryGenre: "alt pop",
      timezone: "Asia/Jakarta",
      website: "https://example.com"
    },
    plan: {
      tier: "pro",
      status: "active"
    }
  });

  const songSeo = generateMusicSeo({
    title: "Think About It",
    artist: "Nova Vale",
    album: "Midnight Systems",
    genre: ["alt pop", "indie electronic"],
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop",
    releaseDate: new Date()
  });

  const song = await Song.create({
    userId: user._id,
    title: "Think About It",
    artist: "Nova Vale",
    album: "Midnight Systems",
    genre: ["alt pop", "indie electronic"],
    releaseDate: subDays(new Date(), 14),
    durationMs: 202000,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&auto=format&fit=crop",
    source: "spotify",
    externalIds: { spotify: "sample-track" },
    platformUrls: {
      spotify: "https://open.spotify.com/",
      appleMusic: "https://music.apple.com/",
      soundCloud: "https://soundcloud.com/",
      youtubeMusic: "https://music.youtube.com/",
      deezer: "https://www.deezer.com/",
      amazonMusic: "https://music.amazon.com/"
    },
    seo: songSeo,
    status: "ready"
  });

  const smartLink = await SmartLink.create({
    userId: user._id,
    songId: song._id,
    slug: "think-about-it",
    title: song.title,
    artist: song.artist,
    coverUrl: song.coverUrl,
    platforms: [
      { platform: "spotify", url: "https://open.spotify.com/", clicks: 142 },
      { platform: "appleMusic", url: "https://music.apple.com/", clicks: 58 },
      { platform: "soundCloud", url: "https://soundcloud.com/", clicks: 35 },
      { platform: "youtubeMusic", url: "https://music.youtube.com/", clicks: 71 },
      { platform: "deezer", url: "https://www.deezer.com/", clicks: 12 },
      { platform: "amazonMusic", url: "https://music.amazon.com/", clicks: 20 }
    ],
    clickCount: 338,
    seo: generateMusicSeo({
      title: song.title,
      artist: song.artist,
      album: song.album,
      coverUrl: song.coverUrl,
      genre: song.genre,
      slug: "think-about-it"
    })
  });

  const campaign = await Campaign.create({
    userId: user._id,
    songId: song._id,
    name: "Think About It Growth Sprint",
    durationDays: 14,
    startDate: subDays(new Date(), 2),
    endDate: addDays(new Date(), 12),
    status: "active",
    contentPlan: {
      audience: "Alt pop fans discovering emotional hooks through short-form video.",
      positioning: "A late-night reflection track built around a memorable save-worthy chorus.",
      postingCadence: "Three posts per day across TikTok, Instagram Reels, and YouTube Shorts.",
      creativeThemes: ["emotional hooks", "studio process", "fan POV", "playlist saves"],
      recommendedWindows: ["18:00-20:00", "12:00-13:00"]
    },
    goals: {
      streams: 18000,
      clicks: 4200,
      saves: 2100,
      followers: 650
    },
    aiInsights: [
      "Instagram Reels outperform TikTok by 24% for emotional hook edits.",
      "Posts between 18:00-20:00 get highest engagement.",
      "Fan POV captions create the strongest smart-link click-through."
    ],
    launchedAt: subDays(new Date(), 2)
  });

  const platforms = ["tiktok", "instagram", "youtube_shorts"] as const;
  const contents = await Promise.all(
    Array.from({ length: 30 }, async (_, index) => {
      const scheduledFor = addDays(new Date(), Math.floor(index / 3));
      scheduledFor.setHours([18, 19, 20][index % 3], index % 2 ? 15 : 0, 0, 0);
      return Content.create({
        userId: user._id,
        songId: song._id,
        campaignId: campaign._id,
        platform: platforms[index % platforms.length],
        type: "idea",
        idea: `Short-form idea ${index + 1} for Think About It`,
        hook: "This chorus is for anyone overthinking tonight.",
        caption: "Think About It is out now. Save it for the late-night drive.",
        hashtags: ["#ThinkAboutIt", "#NovaVale", "#AltPop", "#NewMusic"],
        cta: "Listen through the smart link.",
        creativeDirection: "Open with a close-up lyric moment, then cut to a city-night visual.",
        status: "scheduled",
        scheduledFor
      });
    })
  );

  await Promise.all(
    contents.map((content) =>
      ScheduledPost.create({
        userId: user._id,
        songId: song._id,
        campaignId: campaign._id,
        contentId: content._id,
        platform: content.platform,
        status: "scheduled",
        scheduledFor: content.scheduledFor,
        payload: {
          caption: content.caption,
          hashtags: content.hashtags,
          cta: content.cta
        }
      })
    )
  );

  await ConnectedAccount.create({
    userId: user._id,
    provider: "spotify",
    accountId: "nova-vale",
    displayName: "Nova Vale Spotify",
    scopes: ["metadata", "analytics"],
    syncStatus: "healthy",
    lastSyncedAt: new Date()
  });

  const eventTypes = ["view", "click", "stream", "save", "share", "follow"] as const;
  const devices = ["desktop", "mobile", "tablet"] as const;
  const countries = [
    ["US", "Los Angeles"],
    ["ID", "Jakarta"],
    ["GB", "London"],
    ["BR", "Sao Paulo"],
    ["DE", "Berlin"]
  ];

  await Analytics.insertMany(
    Array.from({ length: 360 }, (_, index) => {
      const eventType = eventTypes[index % eventTypes.length];
      const [country, city] = countries[index % countries.length];
      return {
        userId: user._id,
        songId: song._id,
        campaignId: campaign._id,
        smartLinkId: smartLink._id,
        platform: ["instagram", "tiktok", "youtube_shorts", "spotify"][index % 4],
        eventType,
        value: eventType === "stream" ? 4 : eventType === "view" ? 12 : 1,
        source: ["organic", "bio", "story", "shorts"][index % 4],
        country,
        city,
        device: devices[index % devices.length],
        occurredAt: subDays(new Date(), index % 30)
      };
    })
  );

  console.info("Seed complete");
  console.info("Email: admin@musicgrowthos.test");
  console.info("Password: ChangeMe123!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
