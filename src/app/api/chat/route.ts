import { NextRequest, NextResponse } from "next/server";
import { chatModel } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = chatModel.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }, { status: 500 });
  }
}
