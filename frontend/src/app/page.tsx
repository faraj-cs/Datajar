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
      const res = await fetch("/api/log", { method: "POST", body });
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
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Log File Debugger</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="file"
          accept=".log,.txt,.out,.err"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-red-600 text-sm">{error}</p>
      )}

      {flagged.length > 0 && (
        <div className="mt-8">
          <h2 className="font-medium mb-2">Flagged Lines</h2>
          <pre className="bg-neutral-100 p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
            {flagged.join("\n")}
          </pre>
        </div>
      )}

      {analysis && (
        <div className="mt-8">
          <h2 className="font-medium mb-2">Analysis</h2>
          <div className="prose whitespace-pre-wrap text-sm">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
