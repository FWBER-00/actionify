import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";

export const runtime = "nodejs";

/* ================= helpers ================= */
function clean(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

function trimTo(t: string, max = 12000) {
  const c = clean(t);
  return c.length <= max ? c : c.slice(0, max) + "\n\n[TRUNCATED]";
}

function isValidHttpUrl(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* ================= handlers ================= */
export async function GET() {
  return NextResponse.json({ ok: true, v: "CHECKLIST-API-V1.0.1" });
}

export async function POST(req: Request) {
  try {
    // ---- parse body ----
    const raw = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const url = (payload?.url || "").trim();
    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json(
        { ok: false, error: "https:// 로 시작하는 올바른 URL을 입력해줘." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    // ---- fetch page ----
    let res: Response;
    try {
      res = await fetchWithTimeout(url, 10000);
    } catch (e: any) {
      const msg =
        e?.name === "AbortError"
          ? "페이지 응답이 너무 느려서 분석을 중단했어."
          : "페이지에 접근할 수 없어.";
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `페이지가 정상 응답을 주지 않았어 (status ${res.status})`,
        },
        { status: 502 }
      );
    }

    const len = res.headers.get("content-length");
    if (len && Number(len) > 1_500_000) {
      return NextResponse.json(
        { ok: false, error: "페이지가 너무 커서 분석할 수 없어." },
        { status: 413 }
      );
    }

    const html = await res.text();
    if (html.length > 1_500_000) {
      return NextResponse.json(
        { ok: false, error: "페이지가 너무 커서 분석할 수 없어." },
        { status: 413 }
      );
    }

    // ---- extract text ----
    const $ = cheerio.load(html);
    $("script, style, noscript, iframe").remove();

    const rawText =
      clean($("article").text()) ||
      clean($("main").text()) ||
      clean($("body").text());

    if (!rawText || rawText.length < 200) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "페이지 내용을 읽을 수 없어. (클라이언트 렌더링이거나 차단됨)",
        },
        { status: 422 }
      );
    }

    const content = trimTo(rawText, 12000);

    // ---- snapshot for trust ----
    const title = clean($("title").first().text()) || null;
    const h1 = clean($("h1").first().text()) || null;
    const metaDesc =
      $('meta[name="description"]').attr("content")?.trim() || null;

    const ctaTexts = new Set<string>();
    $("a, button").each((_, el) => {
      const t = clean($(el).text());
      if (!t) return;
      if (t.length > 40) return;

      const hit =
        /구매|구입|결제|신청|문의|상담|가입|무료|체험|다운로드|예약|견적|장바구니|바로|지금|Buy|Shop|Sign|Join|Start|Get|Contact/i.test(
          t
        );
      if (hit) ctaTexts.add(t);
    });

    const snapshot = {
      title,
      h1,
      metaDesc,
      cta_candidates: Array.from(ctaTexts).slice(0, 8),
      link_count: $("a").length,
      button_count: $("button").length,
    };

    // ---- OpenAI ----
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are a senior CRO consultant.
Return ONLY valid JSON with EXACTLY this schema and nothing else:

{
  "snapshot": {
    "title": string | null,
    "h1": string | null,
    "metaDesc": string | null,
    "cta_candidates": string[],
    "link_count": number,
    "button_count": number
  },
  "summary_one_liner": string,
  "score": number,
  "score_breakdown": {
    "clarity": number,
    "offer": number,
    "trust": number,
    "cta": number,
    "friction": number
  },
  "top_issues": [
    { "title": string, "reason": string, "impact": "HIGH" | "MEDIUM" | "LOW" }
  ],
  "quick_wins": [
    { "action": string, "how": string, "example_copy": string | null }
  ],
  "priority_plan": string[],
  "checked_criteria": string[]
}

Rules:
- top_issues MUST be exactly 3 items
- quick_wins MUST be exactly 5 items
- score and each score_breakdown field must be 0~100 integer
- score_breakdown must be roughly consistent with final score
- Use provided snapshot as ground truth (do NOT invent page elements)
- No markdown, no extra keys
- Korean only
          `.trim(),
        },
        {
          role: "user",
          content: `
URL: ${url}

Snapshot (from page):
${JSON.stringify(snapshot)}

Page text:
${content}

Task:
- Diagnose conversion blockers (purchase / inquiry / signup).
- Be specific and practical.
- example_copy는 실제 바로 쓸 수 있는 문구로 작성.
- summary_one_liner는 한 줄 결론.
- checked_criteria는 "무엇을 확인했는지" 체크리스트처럼 8~14개로.
- priority_plan은 4~6단계.
          `.trim(),
        },
      ],
    });

    const out = completion.choices[0]?.message?.content ?? "";

    let result: any;
    try {
      result = JSON.parse(out);
    } catch {
      return NextResponse.json(
        { ok: false, error: "AI 응답이 올바른 JSON이 아니야." },
        { status: 500 }
      );
    }

    // ---- minimal schema guard ----
    const valid =
      result &&
      typeof result.summary_one_liner === "string" &&
      typeof result.score === "number" &&
      result.score_breakdown &&
      Array.isArray(result.top_issues) &&
      Array.isArray(result.quick_wins) &&
      Array.isArray(result.priority_plan) &&
      Array.isArray(result.checked_criteria);

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "진단 결과 형식이 올바르지 않아." },
        { status: 500 }
      );
    }

    // ✅ 서버에서 뽑은 스냅샷을 강제로 사용 (프론트 안정)
    result.snapshot = snapshot;

    return NextResponse.json({
      ok: true,
      data: result,
      v: "CHECKLIST-API-V1.0.1",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}



