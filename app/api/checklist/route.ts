import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export async function GET() {
  return NextResponse.json({ ok: true, v: "CHEERIO-ONLY" });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const { url } = JSON.parse(raw);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  const $ = cheerio.load(html);
  $("script, style, noscript, iframe").remove();

  const text =
    clean($("article").text()) ||
    clean($("main").text()) ||
    clean($("body").text());

  return NextResponse.json({
    ok: true,
    v: "CHEERIO-ONLY",
    status: res.status,
    textLen: text.length,
    preview: text.slice(0, 400),
  });
}
