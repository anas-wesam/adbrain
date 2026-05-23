import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey || apiKey === "your_google_ai_api_key_here") {
    return NextResponse.json({
      status: "error",
      message: "GOOGLE_AI_API_KEY غير مضبوطة. أضفها في .env.local",
    }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("قل مرحباً بكلمة واحدة فقط بالعربي");
    const text = result.response.text();

    return NextResponse.json({
      status: "connected",
      message: "✅ Gemini متصل وشغّال",
      test_response: text,
      model: "gemini-2.0-flash",
    });
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    return NextResponse.json({
      status: "error",
      message: "فشل الاتصال بـ Gemini",
      detail: error?.message || "Unknown error",
    }, { status: 500 });
  }
}
