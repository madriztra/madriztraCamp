import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireApiSession() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return { session: null, response: jsonError("Authentication required", 401) };
  }

  return { session, response: null };
}
