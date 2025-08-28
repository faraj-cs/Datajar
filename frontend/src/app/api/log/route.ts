import { NextRequest, NextResponse } from "next/server";

// Single tool: OpenAI
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "edge"; // Vercel Edge-friendly

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
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

