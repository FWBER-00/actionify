import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body = {};
  try {
    body = await req.json();
  } catch {}
  return NextResponse.json({ ok: true });
}
