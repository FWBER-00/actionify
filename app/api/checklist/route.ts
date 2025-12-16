import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";

export const runtime = "nodejs";

const BUILD = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

export async function GET() {
    const key = process.env.OPENAI_API_KEY ?? "";
    return NextResponse.json({
      ok: true,
      v: "env-check-2",
      vercelEnv: process.env.VERCEL_ENV ?? null,          // "production" / "preview" / "development"
      vercelUrl: process.env.VERCEL_URL ?? null,          // 현재 배포 URL 힌트
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) ?? null,
      hasKey: key.length > 0,
      keyLen: key.length,
    });
  }

function cleanAndTrim(text: string, maxChars = 12000) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars) + "\n\n[TRUNCATED]";
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY missing", v: "cheerio+openai-v1" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { url } = await req.json();

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, iframe").remove();

    const raw =
      $("article").text() || $("main").text() || $("body").text() || "";

    const content = cleanAndTrim(raw, 12000);

    // ✅ 여기서 “체크리스트” 생성
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You create actionable checklists. Output JSON only. No markdown.",
        },
        {
          role: "user",
          content: `URL: ${url}\n\nExtracted text:\n${content}\n\nMake a checklist with 8-15 items. Each item: {title, reason, steps (1-3 bullets)}. Also include a short summary (2-3 lines). Return as JSON: {summary, items}.`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      ok: true,
      v: "cheerio+openai-v1",
      build: BUILD,
      status: res.status,
      checklist: text,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, v: "cheerio+openai-v1", error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
