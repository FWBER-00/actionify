import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, v: "RAW-DEBUG-1" });
}

export async function POST(req: Request) {
  const raw = await req.text();

  // raw가 진짜 JSON이면 이게 성공해야 함
  let parsed: any = null;
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    parseError = String(e?.message ?? e);
  }

  return NextResponse.json({
    ok: true,
    v: "RAW-DEBUG-1",
    contentType: req.headers.get("content-type"),
    rawLen: raw.length,
    rawHead: raw.slice(0, 80),
    rawTail: raw.slice(-80),
    parseError,
    parsed,
  });
}

