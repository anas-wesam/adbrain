import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Part } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey || apiKey === "your_google_ai_api_key_here") {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY غير مضبوطة." }, { status: 400 });
  }

  try {
    const { prompt, imageBase64, imageMime } = await req.json();
    const ai = new GoogleGenAI({ apiKey });

    const parts: Part[] = [];

    if (imageBase64 && imageMime) {
      parts.push({ inlineData: { data: imageBase64, mimeType: imageMime } });
      parts.push({
        text: `Edit this image: ${prompt}. Keep the same product and main subject. High quality, professional result.`,
      });
    } else {
      parts.push({
        text: `${prompt}. Professional advertising photo, high quality, cinematic lighting, sharp details.`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts }],
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const responseParts = response.candidates?.[0]?.content?.parts || [];
    const imgPart = responseParts.find((p: Part) => p.inlineData);

    if (!imgPart?.inlineData?.data) {
      return NextResponse.json({ error: "لم يتم توليد صورة. حاول بوصف مختلف." }, { status: 500 });
    }

    return NextResponse.json({ imageData: imgPart.inlineData.data });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في توليد الصورة. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
