import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Preflight 대응 (배포에서 405 방지)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing on server (Vercel env var not set)." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // 1) URL에서 HTML 가져오기
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `failed to fetch url: ${res.status}` },
        { status: 400 }
      );
    }

    const html = await res.text();

    // 2) 본문 추출
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const title = article?.title?.trim() || "Checklist";

    // 1차: Readability 본문
    let content = (article?.textContent || "").trim();

    // 2차: Readability 실패 시, 너무 짧은 요소들(메뉴/푸터) 최대한 배제해서 긁기
    if (!content || content.length < 200) {
      const doc = dom.window.document;

      doc
        .querySelectorAll("nav, header, footer, aside, script, style, noscript")
        .forEach((el) => el.remove());

      const main =
        doc.querySelector("main") ||
        doc.querySelector("article") ||
        doc.querySelector("[role='main']") ||
        doc.body;

      content = (main?.textContent || "").replace(/\s+/g, " ").trim();
    }

    if (!content || content.length < 200) {
      return NextResponse.json(
        { error: "본문을 충분히 추출하지 못했습니다. (JS 렌더링/로그인/차단 페이지일 수 있음)" },
        { status: 422 }
      );
    }

    // 3) LLM에게 '실행 체크리스트'만 뽑으라고 요청
    const prompt = `
Extract ONLY executable action steps from the text below.

Rules:
- Do NOT summarize
- Do NOT explain
- Each item must be a concrete action
- Start each item with a verb
- 5 to 15 items
- Output plain text, one action per line

Text:
${content.slice(0, 12000)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = completion.choices[0].message.content || "";

    const items = rawText
      .split("\n")
      .map((line) => line.replace(/^[\-\d\.\s]+/, "").trim())
      .filter(Boolean);

    return NextResponse.json({ title, items });
  } catch (e: any) {
    console.error("CHECKLIST_API_ERROR:", e);
    return NextResponse.json(
      {
        error: e?.message || "unknown error",
        name: e?.name || null,
        stack:
          typeof e?.stack === "string"
            ? e.stack.split("\n").slice(0, 8)
            : null,
      },
      { status: 500 }
    );
  }
}
