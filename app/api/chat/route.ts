import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  process.env.OPENROUTER_MODEL || "openrouter/free",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    console.log("API KEY exists?", !!process.env.OPENROUTER_API_KEY);
    console.log("Incoming messages:", messages.length);

    let lastError = "";

    for (const model of MODELS) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("OpenRouter request failed:", text);
        lastError = text;
        continue;
      }

      const data = JSON.parse(text);
      const reply =
        data?.choices?.[0]?.message?.content ||
        "我現在有點忙，但你可以再問我一次。";

      return NextResponse.json({ reply });
    }

    return NextResponse.json(
      { reply: `聊天服務目前失敗：${lastError || "unknown error"}` },
      { status: 500 }
    );
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { reply: "伺服器處理失敗，請稍後再試一次。" },
      { status: 500 }
    );
  }
}