import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();
  return NextResponse.json({ ok: true, url });
}

