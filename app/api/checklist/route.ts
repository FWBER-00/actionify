import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export const runtime = "nodejs";

const BUILD = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

export async function GET() {
  return NextResponse.json({
    ok: true,
    v: "jsdom-import",
    build: BUILD,
    hasJSDOM: typeof JSDOM === "function",
  });
}
