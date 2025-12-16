import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BUILD = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
const NOW = new Date().toISOString();

export async function GET() {
  return NextResponse.json({ ok: true, v: "stable", build: BUILD, now: NOW });
}
