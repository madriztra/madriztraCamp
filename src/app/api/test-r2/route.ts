// app/api/test-r2/route.ts

import { NextResponse } from "next/server";
import { createObjectKey, uploadBuffer } from "@/lib/s3";

export async function GET() {
  try {
    const url = await uploadBuffer({
      key: createObjectKey("test", "test.txt"),
      body: Buffer.from("hello"),
      contentType: "text/plain",
    });

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}
