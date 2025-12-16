"use client";

import { useMemo, useState } from "react";

type ChecklistItem = {
  title: string;
  reason: string;
  steps: string[];
};

type Checklist = {
  summary: string;
  items: ChecklistItem[];
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  const [done, setDone] = useState<Record<number, boolean>>({});

  const progress = useMemo(() => {
    if (!checklist?.items?.length) return { doneCount: 0, total: 0, pct: 0 };
    const total = checklist.items.length;
    const doneCount = checklist.items.reduce(
      (acc, _, idx) => acc + (done[idx] ? 1 : 0),
      0
    );
    const pct = total ? Math.round((doneCount / total) * 100) : 0;
    return { doneCount, total, pct };
  }, [checklist, done]);

  async function onGenerate() {
    setError("");
    setChecklist(null);
    setDone({});

    const u = url.trim();
    if (!u) {
      setError("URL을 입력해.");
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

      setChecklist(data.checklist);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>URL → 실행 체크리스트</h1>
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        URL을 넣으면 요약이 아니라 “바로 실행 가능한 체크리스트”를 뽑아준다.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 10,
            outline: "none",
          }}
        />
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: loading ? "#f4f4f4" : "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "생성 중..." : "체크리스트 생성"}
        </button>
      </div>

      {error && (
        <p style={{ color: "crimson", marginTop: 12, whiteSpace: "pre-wrap" }}>
          {error}
        </p>
      )}

      {checklist && (
        <section style={{ marginTop: 22 }}>
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 800 }}>Summary</div>
              <div style={{ opacity: 0.7 }}>
                {progress.doneCount}/{progress.total} ({progress.pct}%)
              </div>
            </div>

            <p style={{ marginTop: 8, lineHeight: 1.5 }}>{checklist.summary}</p>

            <div
              style={{
                marginTop: 10,
                height: 10,
                borderRadius: 999,
                background: "#f2f2f2",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress.pct}%`,
                  background: "#111",
                }}
              />
            </div>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 16 }}>
            Checklist Items
          </h2>

          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: "none" }}>
            {checklist.items.map((it, idx) => {
              const checked = !!done[idx];
              return (
                <li
                  key={idx}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    background: checked ? "#fafafa" : "white",
                  }}
                >
                  <label style={{ display: "flex", gap: 10, alignItems: "start" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setDone((prev) => ({ ...prev, [idx]: e.target.checked }))
                      }
                      style={{ marginTop: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          textDecoration: checked ? "line-through" : "none",
                        }}
                      >
                        {it.title}
                      </div>

                      {it.reason && (
                        <div style={{ marginTop: 6, opacity: 0.75 }}>
                          {it.reason}
                        </div>
                      )}

                      {Array.isArray(it.steps) && it.steps.length > 0 && (
                        <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                          {it.steps.map((s, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
