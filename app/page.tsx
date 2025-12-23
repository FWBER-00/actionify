"use client";

import { useMemo, useState } from "react";

type Result = {
  snapshot?: {
    title: string | null;
    h1: string | null;
    metaDesc: string | null;
    cta_candidates: string[];
    link_count: number;
    button_count: number;
  };
  summary_one_liner: string;
  score: number;
  score_breakdown?: {
    clarity: number;
    offer: number;
    trust: number;
    cta: number;
    friction: number;
  };
  top_issues: { title: string; reason: string; impact: string }[];
  quick_wins: { action: string; how: string; example_copy?: string | null }[];
  priority_plan: string[];
  checked_criteria: string[];
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const c = {
    bg: "#0b0b0f",
    panel: "#12121a",
    panel2: "#161624",
    border: "rgba(255,255,255,0.10)",
    border2: "rgba(255,255,255,0.14)",
    text: "rgba(255,255,255,0.92)",
    muted: "rgba(255,255,255,0.65)",
    muted2: "rgba(255,255,255,0.50)",
    danger: "#ff4d6d",
    chip: "rgba(255,255,255,0.08)",
    btn: "#ffffff",
    btnText: "#0b0b0f",
    btnDisabled: "rgba(255,255,255,0.25)",
  };

  async function onGenerate() {
    setError("");
    setResult(null);

    const u = url.trim();
    if (!u) {
      setError("URL을 입력해줘.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `request failed: ${res.status}`);
      }

      // 우리가 기대하는 값은 data.data
      setResult(data.data);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  // ✅ 복사 실패/권한 문제를 피하기 위해 "화면에 리포트 텍스트를 띄움"
  const reportText = useMemo(() => {
    if (!result) return "";

    const lines: string[] = [];
    lines.push(`전환 진단 리포트`);
    lines.push(`URL: ${url.trim()}`);
    lines.push(`점수: ${result.score}/100`);
    lines.push(`한 줄 결론: ${result.summary_one_liner}`);
    lines.push(``);

    const s = result.snapshot;
    lines.push(`스냅샷(근거)`);
    lines.push(`- Title: ${s?.title || "-"}`);
    lines.push(`- H1: ${s?.h1 || "-"}`);
    lines.push(`- Meta: ${s?.metaDesc || "-"}`);
    lines.push(`- Links/Buttons: ${s?.link_count ?? "-"} / ${s?.button_count ?? "-"}`);
    lines.push(`- CTA 후보: ${s?.cta_candidates?.length ? s.cta_candidates.join(" · ") : "-"}`);
    lines.push(``);

    const b = result.score_breakdown;
    if (b) {
      lines.push(`점수 breakdown`);
      lines.push(`- 명확성 ${b.clarity} / 오퍼 ${b.offer} / 신뢰 ${b.trust} / CTA ${b.cta} / 마찰 ${b.friction}`);
      lines.push(``);
    }

    lines.push(`TOP3 문제`);
    result.top_issues?.forEach((t, i) => {
      lines.push(`${i + 1}. [${t.impact}] ${t.title}`);
      lines.push(`   - ${t.reason}`);
    });
    lines.push(``);

    lines.push(`10분 Quick Wins`);
    result.quick_wins?.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.action}`);
      lines.push(`   - 방법: ${q.how}`);
      if (q.example_copy) lines.push(`   - 예시 문구: ${q.example_copy}`);
    });
    lines.push(``);

    lines.push(`우선순위 플랜`);
    result.priority_plan?.forEach((p, i) => lines.push(`${i + 1}) ${p}`));
    lines.push(``);

    lines.push(`이번 진단에서 확인한 기준`);
    result.checked_criteria?.forEach((x) => lines.push(`- ${x}`));

    return lines.join("\n");
  }, [result, url]);

  return (
    <main style={{ minHeight: "100vh", background: c.bg, color: c.text, padding: 16 }}>
      <div style={{ maxWidth: 900, margin: "40px auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.4 }}>
          CRO 리포트 생성기
        </h1>
        <p style={{ marginTop: 8, color: c.muted }}>
          URL을 넣으면 전환을 막는 문제 TOP3 + 10분 액션 5개 + 리포트를 뽑아준다.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 16,
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${c.border}`,
            background: c.panel,
          }}
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            style={{
              flex: 1,
              padding: 12,
              border: `1px solid ${c.border2}`,
              borderRadius: 12,
              outline: "none",
              background: c.panel2,
              color: c.text,
            }}
          />
          <button
            onClick={onGenerate}
            disabled={loading}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              background: loading ? c.btnDisabled : c.btn,
              color: c.btnText,
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "진단 중..." : "리포트 생성"}
          </button>
        </div>

        {error && (
          <p style={{ color: c.danger, marginTop: 12, whiteSpace: "pre-wrap" }}>
            {error}
          </p>
        )}

        {result && (
          <section style={{ marginTop: 22 }}>
            {/* Score card */}
            <div
              style={{
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: 14,
                background: c.panel,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>점수 {result.score}/100</div>
                <button
                  onClick={() => setShowDebug((v) => !v)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: `1px solid ${c.border}`,
                    background: c.panel2,
                    color: c.text,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {showDebug ? "디버그 닫기" : "디버그 보기"}
                </button>
              </div>

              <p style={{ marginTop: 10, lineHeight: 1.6 }}>{result.summary_one_liner}</p>

              {result.score_breakdown && (
                <div style={{ marginTop: 10, color: c.muted }}>
                  점수 breakdown:{" "}
                  <span style={{ color: c.text }}>
                    명확성 {result.score_breakdown.clarity} · 오퍼 {result.score_breakdown.offer} · 신뢰{" "}
                    {result.score_breakdown.trust} · CTA {result.score_breakdown.cta} · 마찰{" "}
                    {result.score_breakdown.friction}
                  </span>
                </div>
              )}
            </div>

            {/* Snapshot */}
            <div
              style={{
                marginTop: 12,
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: 14,
                background: c.panel,
              }}
            >
              <div style={{ fontWeight: 900 }}>🔎 페이지 스냅샷(근거)</div>
              <div style={{ marginTop: 10, color: c.muted, lineHeight: 1.7 }}>
                <div>Title: {result.snapshot?.title || "-"}</div>
                <div>H1: {result.snapshot?.h1 || "-"}</div>
                <div>Meta: {result.snapshot?.metaDesc || "-"}</div>
                <div>
                  Links / Buttons: {result.snapshot?.link_count ?? "-"} / {result.snapshot?.button_count ?? "-"}
                </div>
                <div>
                  CTA 후보:{" "}
                  {result.snapshot?.cta_candidates?.length
                    ? result.snapshot.cta_candidates.join(" · ")
                    : "-"}
                </div>
              </div>
            </div>

            {/* TOP issues */}
            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 18 }}>🔥 가장 큰 문제 TOP 3</h2>
            <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: "none" }}>
              {result.top_issues.map((it, idx) => (
                <li
                  key={idx}
                  style={{
                    border: `1px solid ${c.border}`,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    background: c.panel,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900 }}>{it.title}</div>
                    <div
                      style={{
                        color: c.muted,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: c.chip,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      {it.impact}
                    </div>
                  </div>
                  <div style={{ marginTop: 8, color: c.muted }}>{it.reason}</div>
                </li>
              ))}
            </ul>

            {/* Quick wins */}
            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 18 }}>⚡ 10분 Quick Wins</h2>
            <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: "none" }}>
              {result.quick_wins.map((q, idx) => (
                <li
                  key={idx}
                  style={{
                    border: `1px solid ${c.border}`,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    background: c.panel,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{q.action}</div>
                  <div style={{ marginTop: 8, color: c.muted }}>{q.how}</div>
                  {q.example_copy && <div style={{ marginTop: 10, color: c.muted2 }}>예시: {q.example_copy}</div>}
                </li>
              ))}
            </ul>

            {/* Report box (manual copy) */}
            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 18 }}>📄 리포트 텍스트</h2>
            <p style={{ marginTop: 6, color: c.muted }}>
              복사 버튼이 안 먹는 브라우저가 있어서, 여기 텍스트를 그냥 <b>Ctrl+A → Ctrl+C</b>로 복사하면 된다.
            </p>
            <textarea
              value={reportText}
              readOnly
              style={{
                width: "100%",
                height: 260,
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${c.border2}`,
                background: c.panel2,
                color: c.text,
                outline: "none",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            />

            {/* Debug raw JSON */}
            {showDebug && (
              <div
                style={{
                  marginTop: 14,
                  border: `1px solid ${c.border}`,
                  borderRadius: 14,
                  padding: 14,
                  background: c.panel,
                }}
              >
                <div style={{ fontWeight: 900 }}>🧪 디버그(JSON 원본)</div>
                <pre style={{ marginTop: 10, whiteSpace: "pre-wrap", color: c.muted }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
