import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey || apiKey === "your_google_ai_api_key_here") {
    return NextResponse.json(
      { error: "⚠️ GOOGLE_AI_API_KEY غير مضبوطة. أضفها في .env.local ثم أعد تشغيل السيرفر." },
      { status: 400 }
    );
  }

  try {
    const { messages, imageBase64, imageMime } = await req.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `أنت "أد برين"، مساعد تسويقي ذكي متخصص للشركات والعلامات التجارية العربية.
مهمتك:
- مساعدة أصحاب المشاريع في كتابة محتوى تسويقي احترافي بالعربي
- إنشاء نصوص إعلانية مقنعة وجذابة
- اقتراح أفكار حملات تسويقية متكاملة
- كتابة بوستات سوشيال ميديا لمنصات مختلفة
- تحليل الجمهور المستهدف وتقديم توصيات
- عند إرسال صورة مرجعية: حلّل المنتج أو التصميم واقترح محتوى تسويقياً مناسباً

تحدث دائماً بالعربية. كن ودوداً ومحترفاً.`,
    });

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    // Build parts: image first (if present), then text
    const parts: Part[] = [];
    if (imageBase64 && imageMime) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMime,
        },
      });
    }
    parts.push({ text: lastMessage });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(parts);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    console.error("Chat error:", error);

    if (error?.message?.includes("API_KEY_INVALID") || error?.status === 400) {
      return NextResponse.json(
        { error: "❌ API Key غير صحيح. تحقق من .env.local" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "حدث خطأ في الاتصال بـ Gemini. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
