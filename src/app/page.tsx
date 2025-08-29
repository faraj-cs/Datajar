"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Please choose a log file.");
      return;
    }
    setLoading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/chat/log-analyze`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setFlagged(data.flagged || []);
      setAnalysis(data.analysis || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-neutral-200/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Log File Debugger</h1>
          <span className="text-xs text-neutral-500">Next.js + FastAPI</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid gap-8">
        <section className="rounded-lg border border-neutral-200/60 bg-white/60 backdrop-blur p-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <label className="text-sm font-medium">Upload a log file</label>
            <div className="grid gap-3">
              <input
                type="file"
                accept=".log,.txt,.out,.err"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-900 file:text-white hover:file:bg-neutral-800"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-neutral-900 text-white text-sm h-10 px-4 disabled:opacity-50"
              >
                {loading ? "Analyzing…" : "Analyze"}
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </form>
        </section>

        <section className="grid gap-6">
          {flagged.length > 0 && (
            <div className="rounded-lg border border-neutral-200/60 bg-white p-4">
              <h2 className="font-medium mb-2 text-sm">Flagged Lines</h2>
              <pre className="bg-neutral-50 border border-neutral-200 rounded p-3 text-[11px] leading-5 overflow-auto max-h-72 whitespace-pre-wrap">
                {flagged.join("\n")}
              </pre>
            </div>
          )}

          {analysis && (
            <div className="rounded-lg border border-neutral-200/60 bg-white p-4">
              <h2 className="font-medium mb-2 text-sm">Analysis</h2>
              <div className="prose whitespace-pre-wrap text-sm">
                {analysis}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-neutral-200/60">
        <div className="max-w-4xl mx-auto px-6 py-4 text-xs text-neutral-500">
          Upload logs, get quick findings and fixes.
        </div>
      </footer>
    </div>
  );
}
