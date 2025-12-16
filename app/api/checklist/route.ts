import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    v: "jsdom-import-ok",
    hasJSDOM: typeof JSDOM === "function",
  });
}
