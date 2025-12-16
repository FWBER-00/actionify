import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { url } = await req.json();

  const res = await fetch(url, {
    headers: {
      // 간단한 UA 없으면 막는 사이트가 있어서 최소값
      "User-Agent": "Mozilla/5.0",
    },
  });

  const html = await res.text();

  return NextResponse.json({
    ok: true,
    v: "v3-fetch",
    status: res.status,
    html_len: html.length,
    head: html.slice(0, 200),
  });
}
