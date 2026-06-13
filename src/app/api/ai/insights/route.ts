import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function POST() {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  const summary = await getAnalyticsSummary(session.user.id, 30);

  return NextResponse.json({ insights: summary.insights });
}
