import { NextResponse } from "next/server";

import { recordSmartLinkClick } from "@/lib/analytics";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");
  const source = url.searchParams.get("source");

  if (!platform) {
    return NextResponse.redirect(new URL(`/listen/${slug}`, request.url));
  }

  const destination = await recordSmartLinkClick({
    slug,
    platform,
    source,
    userAgent: request.headers.get("user-agent"),
    country: request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry"),
    city: request.headers.get("x-vercel-ip-city"),
    referrer: request.headers.get("referer")
  });

  if (!destination) {
    return NextResponse.redirect(new URL(`/listen/${slug}`, request.url));
  }

  return NextResponse.redirect(destination);
}
