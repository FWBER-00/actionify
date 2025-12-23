"use client";

import { useState } from "react";

type Result = {
  summary_one_liner: string;
  score: number;
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

  async function onGenerate() {
    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("URL을 입력해줘.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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

  return (
    <main style={{ minHeight: "100vh", background: "#0b0b0f", color: "#fff", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>랜딩페이지 전환 진단기</h1>
        <p style={{ opacity: 0.7, marginTop: 8 }}>
          URL 하나로 전환을 막는 문제와 바로 고칠 액션을 뽑아준다.
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={{ flex: 1, padding: 12 }}
          />
          <button onClick={onGenerate} disabled={loading}>
            {loading ? "진단 중..." : "진단"}
          </button>
        </div>

        {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

        {result && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 22 }}>
              점수 {result.score}/100
            </h2>
            <p style={{ marginTop: 8 }}>{result.summary_one_liner}</p>

            <h3 style={{ marginTop: 24 }}>🔥 가장 큰 문제 TOP 3</h3>
            {result.top_issues.map((it, i) => (
              <div key={i} style={{ marginTop: 12 }}>
                <strong>{it.title}</strong> ({it.impact})  
                <div style={{ opacity: 0.8 }}>{it.reason}</div>
              </div>
            ))}

            <h3 style={{ marginTop: 24 }}>⚡ 10분 Quick Wins</h3>
            {result.quick_wins.map((q, i) => (
              <div key={i} style={{ marginTop: 12 }}>
                <strong>{q.action}</strong>
                <div>{q.how}</div>
                {q.example_copy && (
                  <div style={{ opacity: 0.7 }}>예시: {q.example_copy}</div>
                )}
              </div>
            ))}

            <h3 style={{ marginTop: 24 }}>🧭 우선순위 플랜</h3>
            <ol>
              {result.priority_plan.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>

            <button
              style={{ marginTop: 24 }}
              onClick={() =>
                navigator.clipboard.writeText(
                  JSON.stringify(result, null, 2)
                )
              }
            >
              결과 복사
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
