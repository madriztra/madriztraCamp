import { NextResponse } from "next/server";

import { generatePerformanceInsights } from "@/lib/ai/insights";

export async function GET() {
  const insights = await generatePerformanceInsights({
    mode: process.env.AI_PROVIDER ?? "local",
    sample: {
      instagram: { engagementRate: 7.8, clicks: 420 },
      tiktok: { engagementRate: 6.1, clicks: 338 },
      bestWindow: "18:00-20:00"
    }
  });

  return NextResponse.json({
    success: true,
    mode: process.env.AI_PROVIDER ?? "local",
    result: insights
  });
}
