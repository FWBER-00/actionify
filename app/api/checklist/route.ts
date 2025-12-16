import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, v: "v4-readability" });
}

export async function POST(req: Request) {
  const { url } = await req.json();

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  return NextResponse.json({
    ok: true,
    v: "v4-readability",
    status: res.status,
    title: article?.title ?? null,
    text_len: article?.textContent?.length ?? 0,
  });
}


