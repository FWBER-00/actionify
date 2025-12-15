"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function onGenerate() {
    setError("");
    setTitle("");
    setItems([]);

    if (!url.trim()) {
      setError("URL을 입력해.");
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
      if (!res.ok) throw new Error(data?.error || "request failed");

      setTitle(data.title);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>URL → 실행 체크리스트</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        URL을 넣으면 “요약”이 아니라 “해야 할 일 체크리스트”만 뽑는다.
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
            borderRadius: 8,
          }}
        />
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          {loading ? "생성 중..." : "체크리스트 생성"}
        </button>
      </div>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      {title && (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>

          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: "none" }}>
            {items.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 10 }}>
                <label style={{ display: "flex", gap: 10, alignItems: "start" }}>
                  <input type="checkbox" style={{ marginTop: 4 }} />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
