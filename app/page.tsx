"use client";

import { useState } from "react";

type Result = {
  snapshot: {
    title: string | null;
    h1: string | null;
    metaDesc: string | null;
    cta_candidates: string[];
    link_count: number;
    button_count: number;
  };
  summary_one_liner: string;
  score: number;
  score_breakdown: {
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
        throw new Error(data?.error || "진단에 실패했어.");
      }
      setResult(data.data);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  function copyReport() {
    if (!result) return;

    const lines: string[] = [];
    lines.push(`전환 진단 리포트`);
    lines.push(`URL: ${url.trim()}`);
    lines.push(`점수: ${result.score}/100`);
    lines.push(`한 줄 결론: ${result.summary_one_liner}`);
    lines.push(``);

    lines.push(`스냅샷(근거)`);
    lines.push(`- Title: ${result.snapshot.title || "-"}`);
    lines.push(`- H1: ${result.snapshot.h1 || "-"}`);
    lines.push(`- Meta: ${result.snapshot.metaDesc || "-"}`);
    lines.push(
      `- Links/Buttons: ${result.snapshot.link_count}/${result.snapshot.button_count}`
    );
    lines.push(
      `- CTA 후보: ${
        result.snapshot.cta_candidates?.length
          ? result.snapshot.cta_candidates.join(" · ")
          : "-"
      }`
    );
    lines.push(``);

    lines.push(`점수 breakdown`);
    lines.push(
      `- 명확성 ${result.score_breakdown.clarity} / 오퍼 ${result.score_breakdown.offer} / 신뢰 ${result.score_breakdown.trust} / CTA ${result.score_breakdown.cta} / 마찰 ${result.score_breakdown.friction}`
    );
    lines.push(``);

    lines.push(`TOP3 문제`);
    result.top_issues.forEach((t, i) => {
      lines.push(`${i + 1}. [${t.impact}] ${t.title}`);
      lines.push(`   - ${t.reason}`);
    });
    lines.push(``);

    lines.push(`10분 Quick Wins`);
    result.quick_wins.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.action}`);
      lines.push(`   - 방법: ${q.how}`);
      if (q.example_copy) lines.push(`   - 예시 문구: ${q.example_copy}`);
    });
    lines.push(``);

    lines.push(`우선순위 플랜`);
    result.priority_plan.forEach((p, i) => lines.push(`${i + 1}) ${p}`));
    lines.push(``);

    lines.push(`이번 진단에서 확인한 기준`);
    result.checked_criteria.forEach((x) => lines.push(`- ${x}`));

    navigator.clipboard.writeText(lines.join("\n"));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 900, margin: "40px auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.4 }}>
          랜딩페이지 전환 진단기
        </h1>
        <p style={{ marginTop: 8, color: c.muted }}>
          URL을 넣으면 “요약”이 아니라, 전환을 막는 문제와 바로 고칠 문구/액션을 뽑아준다.
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
            {loading ? "진단 중..." : "전환 진단 생성"}
          </button>
        </div>

        {error && (
          <p style={{ color: c.danger, marginTop: 12, whiteSpace: "pre-wrap" }}>
            {error}
          </p>
        )}

        {result && (
          <section style={{ marginTop: 22 }}>
            {/* Score + One-liner */}
            <div
              style={{
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: 14,
                background: c.panel,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>
                  점수 {result.score}/100
                </div>
                <div
                  style={{
                    color: c.muted,
                    fontWeight: 700,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: c.chip,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  v1.0.1
                </div>
              </div>

              <p style={{ marginTop: 10, lineHeight: 1.6, color: c.text }}>
                {result.summary_one_liner}
              </p>

              <div style={{ marginTop: 14, color: c.muted }}>
                점수 breakdown:{" "}
                <span style={{ color: c.text }}>
                  명확성 {result.score_breakdown.clarity} · 오퍼{" "}
                  {result.score_breakdown.offer} · 신뢰{" "}
                  {result.score_breakdown.trust} · CTA{" "}
                  {result.score_breakdown.cta} · 마찰{" "}
                  {result.score_breakdown.friction}
                </span>
              </div>

              <div style={{ marginTop: 14 }}>
                <button
                  onClick={copyReport}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${c.border}`,
                    background: c.panel2,
                    color: c.text,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  리포트 복사
                </button>
              </div>
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
                <div>
                  <span style={{ color: c.muted2 }}>Title:</span>{" "}
                  {result.snapshot.title || "-"}
                </div>
                <div>
                  <span style={{ color: c.muted2 }}>H1:</span>{" "}
                  {result.snapshot.h1 || "-"}
                </div>
                <div>
                  <span style={{ color: c.muted2 }}>Meta:</span>{" "}
                  {result.snapshot.metaDesc || "-"}
                </div>
                <div>
                  <span style={{ color: c.muted2 }}>Links / Buttons:</span>{" "}
                  {result.snapshot.link_count} / {result.snapshot.button_count}
                </div>
                <div>
                  <span style={{ color: c.muted2 }}>CTA 후보:</span>{" "}
                  {result.snapshot.cta_candidates?.length
                    ? result.snapshot.cta_candidates.join(" · ")
                    : "-"}
                </div>
              </div>
            </div>

            {/* Top issues */}
            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 18 }}>
              🔥 가장 큰 문제 TOP 3
            </h2>

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
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
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
            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 18 }}>
              ⚡ 10분 Quick Wins
            </h2>

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
                  {q.example_copy && (
                    <div style={{ marginTop: 10, color: c.muted2 }}>
                      예시 문구:{" "}
                      <span style={{ color: c.text }}>{q.example_copy}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Priority plan */}
            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 18 }}>
              🧭 우선순위 플랜
            </h2>
            <ol style={{ marginTop: 10, color: c.muted, lineHeight: 1.8 }}>
              {result.priority_plan.map((p, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {p}
                </li>
              ))}
            </ol>

            {/* Checked criteria */}
            <div
              style={{
                marginTop: 12,
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: 14,
                background: c.panel,
              }}
            >
              <div style={{ fontWeight: 900 }}>✅ 이번 진단에서 확인한 기준</div>
              <ul style={{ marginTop: 10, paddingLeft: 18, color: c.muted }}>
                {result.checked_criteria.map((x, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
