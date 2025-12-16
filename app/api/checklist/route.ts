import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const BUILD = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

export async function GET() {
  return NextResponse.json({ ok: true, v: "cheerio-v1", build: BUILD });
}

export async function POST(req: Request) {
  const { url } = await req.json();

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // 불필요한 것 제거
  $("script, style, noscript, iframe").remove();

  // 간단한 본문 후보: article > main > body 순
  const text =
    ($("article").text() || $("main").text() || $("body").text() || "")
      .replace(/\s+/g, " ")
      .trim();

  return NextResponse.json({
    ok: true,
    v: "cheerio-v1",
    status: res.status,
    text_len: text.length,
    text_head: text.slice(0, 400),
  });
}
