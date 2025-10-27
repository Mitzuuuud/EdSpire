// app/api/openrouter/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body?.messages;
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid `messages` in request body" }, { status: 400 });
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not set on server" }, { status: 500 });
    }

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        // optionally: "HTTP-Referer": process.env.SITE_URL || "",
        // optionally: "X-Title": process.env.SITE_NAME || ""
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      // forward the provider error
      return NextResponse.json({ error: data }, { status: resp.status });
    }

    // Best-effort extraction of assistant text
    let assistantText: string | null = null;
    if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
      assistantText = data.choices[0].message.content;
    } else if (typeof data.output_text === "string") {
      assistantText = data.output_text;
    } else {
      assistantText = JSON.stringify(data);
    }

    return NextResponse.json({ assistant: assistantText, raw: data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
