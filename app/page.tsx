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

  // ===== Dark theme tokens (inline) =====
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
    btn: "#ffffff",
    btnText: "#0b0b0f",
    btnDisabled: "rgba(255,255,255,0.25)",
    chip: "rgba(255,255,255,0.08)",
  };

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
          URL → 실행 체크리스트
        </h1>
        <p style={{ marginTop: 8, color: c.muted }}>
          URL을 넣으면 요약이 아니라 “바로 실행 가능한 체크리스트”를 뽑아준다.
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
            {loading ? "생성 중..." : "체크리스트 생성"}
          </button>
        </div>

        {error && (
          <p style={{ color: c.danger, marginTop: 12, whiteSpace: "pre-wrap" }}>
            {error}
          </p>
        )}

        {checklist && (
          <section style={{ marginTop: 22 }}>
            {/* Summary card */}
            <div
              style={{
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: 14,
                background: c.panel,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 900 }}>Summary</div>

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
                  {progress.doneCount}/{progress.total} ({progress.pct}%)
                </div>
              </div>

              <p style={{ marginTop: 10, lineHeight: 1.6, color: c.text }}>
                {checklist.summary}
              </p>

              <div
                style={{
                  marginTop: 12,
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.10)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress.pct}%`,
                    background: "rgba(255,255,255,0.85)",
                  }}
                />
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 18 }}>
              Checklist Items
            </h2>

            <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: "none" }}>
              {checklist.items.map((it, idx) => {
                const checked = !!done[idx];
                return (
                  <li
                    key={idx}
                    style={{
                      border: `1px solid ${c.border}`,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      background: checked ? "rgba(255,255,255,0.05)" : c.panel,
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setDone((prev) => ({ ...prev, [idx]: e.target.checked }))
                        }
                        style={{
                          marginTop: 4,
                          width: 18,
                          height: 18,
                          accentColor: "#ffffff",
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 900,
                            color: c.text,
                            textDecoration: checked ? "line-through" : "none",
                            opacity: checked ? 0.75 : 1,
                          }}
                        >
                          {it.title}
                        </div>

                        {it.reason && (
                          <div style={{ marginTop: 8, color: c.muted }}>
                            {it.reason}
                          </div>
                        )}

                        {Array.isArray(it.steps) && it.steps.length > 0 && (
                          <ul style={{ marginTop: 12, paddingLeft: 18, color: c.muted2 }}>
                            {it.steps.map((s, i) => (
                              <li key={i} style={{ marginBottom: 8, color: c.muted }}>
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
      </div>
    </main>
  );
}
