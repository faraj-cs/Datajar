import { NextRequest, NextResponse } from "next/server";

// Single tool: OpenAI
import OpenAI from "openai";

export const runtime = "nodejs"; // Vercel Node.js runtime

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const flagged: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes("error") || lower.includes("warn") || lower.includes("exception") || lower.includes("fail")) {
        flagged.push(`L${i + 1}: ${lines[i]}`);
      }
      if (flagged.length >= 200) break;
    }

    const systemPrompt = `You are a precise log analysis assistant. Given flagged log lines, output two sections: \n\nFindings:\n- ...\nFixes:\n- ...\nKeep output concise.`;

    const userContent = flagged.length ? flagged.join("\n") : "No flagged lines.";

    // Fallback if no API key present
    if (!process.env.OPENAI_API_KEY) {
      const counts: Record<string, number> = {};
      for (const line of flagged) {
        const lower = line.toLowerCase();
        ["error", "warn", "exception", "fail"].forEach((k) => {
          if (lower.includes(k)) counts[k] = (counts[k] || 0) + 1;
        });
      }
      const keys = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
      const summary = `Findings:\n- Flagged lines: ${flagged.length}\n- Top signals: ${keys.map(k => `${k}(${counts[k]})`).join(", ") || "none"}\n\nFixes:\n- Inspect the highest-frequency signals first.\n- Reproduce errors locally with increased logging.`;
      return NextResponse.json({ flagged, analysis: summary });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const analysis = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ flagged, analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

