"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${apiBase}/chat/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Session" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create session");
        setSessionId(data.id as string);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      }
    };
    init();
  }, [apiBase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!sessionId || !input.trim()) return;
    setError(null);
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await fetch(`${apiBase}/chat/sessions/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || "Request failed");
      const content = (data?.content as string) || "";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) {
      setError("Please choose a log file.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${apiBase}/chat/log-analyze`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      const analysisText = (data?.analysis as string) || "";
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Uploaded file: ${file.name}` },
        { role: "assistant", content: analysisText },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-neutral-700/60 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Log File Debugger</h1>
          <span className="text-xs text-neutral-300">Next.js + FastAPI</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid gap-6">
        <section className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 backdrop-blur p-4">
          <div className="text-sm text-neutral-300 mb-3">Chat</div>
          <div className="h-72 overflow-auto rounded border border-neutral-700 bg-neutral-900 p-3 text-sm">
            {messages.length === 0 && (
              <div className="text-neutral-400 text-sm">Start by asking a question or upload a log file.</div>
            )}
            <div className="grid gap-3">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === "user" ? "text-neutral-100" : "text-neutral-300"}>
                  <div className="text-[10px] uppercase tracking-wide text-neutral-400 mb-1">{m.role}</div>
                  <div className="whitespace-pre-wrap leading-6">{m.content}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 rounded border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 h-10 px-3 text-sm"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={sending || !sessionId}
              className="rounded bg-neutral-800 text-white text-sm h-10 px-4 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 backdrop-blur p-4">
          <div className="text-sm text-neutral-300 mb-3">Upload log file</div>
          <div className="grid gap-3">
            <input
              type="file"
              accept=".log,.txt,.out,.err"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 text-neutral-200"
            />
            <button
              onClick={() => void uploadAndAnalyze()}
              disabled={uploading || !file}
              className="inline-flex items-center justify-center rounded-md bg-neutral-800 text-white text-sm h-10 px-4 disabled:opacity-50"
            >
              {uploading ? "Analyzing…" : "Analyze file"}
            </button>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-700/60 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-6 py-4 text-xs text-neutral-400">
          Chat and upload logs for quick findings and fixes.
        </div>
      </footer>
    </div>
  );
}
