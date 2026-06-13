import { NextResponse } from "next/server";

import { jsonError, requireApiSession } from "@/lib/api";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function GET(request: Request) {
  const { session, response } = await requireApiSession();

  if (response) {
    return response;
  }

  const days = Number(new URL(request.url).searchParams.get("days") ?? 30);

  if (!Number.isFinite(days) || days < 1 || days > 365) {
    return jsonError("days must be between 1 and 365");
  }

  const summary = await getAnalyticsSummary(session.user.id, days);

  return NextResponse.json(summary);
}
