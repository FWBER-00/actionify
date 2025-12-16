import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";

export const runtime = "nodejs";

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function trimTo(text: string, maxChars = 12000) {
  const t = clean(text);
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + "\n\n[TRUNCATED]";
}

export async function GET() {
  return NextResponse.json({ ok: true, v: "CHECKLIST-API-V1" });
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();

    let payload: any;
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json(
        { ok: false, v: "CHECKLIST-API-V1", error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const url = payload?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { ok: false, v: "CHECKLIST-API-V1", error: "Missing url" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, v: "CHECKLIST-API-V1", error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();

    const $ = cheerio.load(html);
    $("script, style, noscript, iframe").remove();

    const rawText =
      clean($("article").text()) ||
      clean($("main").text()) ||
      clean($("body").text());

    const content = trimTo(rawText, 12000);

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            'You create actionable checklists. Return ONLY valid JSON with this schema exactly: {"summary": string, "items": [{"title": string, "reason": string, "steps": string[]}]} . steps length 1-3. No markdown, no extra keys.',
        },
        {
          role: "user",
          content: `URL: ${url}\n\nExtracted text:\n${content}\n\nCreate an actionable checklist (8-15 items).`,
        },
      ],
    });

    const out = completion.choices[0]?.message?.content ?? "";

    let checklist: any;
    try {
      checklist = JSON.parse(out);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          v: "CHECKLIST-API-V1",
          error: "Model did not return valid JSON",
          rawModelOutputHead: out.slice(0, 200),
        },
        { status: 500 }
      );
    }

    // 최소 검증
    if (
      !checklist ||
      typeof checklist.summary !== "string" ||
      !Array.isArray(checklist.items)
    ) {
      return NextResponse.json(
        {
          ok: false,
          v: "CHECKLIST-API-V1",
          error: "Checklist JSON schema invalid",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      v: "CHECKLIST-API-V1",
      status: res.status,
      checklist,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, v: "CHECKLIST-API-V1", error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
