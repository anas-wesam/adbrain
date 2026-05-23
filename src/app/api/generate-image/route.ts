import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Part } from "@google/genai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey || apiKey === "your_google_ai_api_key_here") {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY غير مضبوطة." }, { status: 400 });
  }

  try {
    const { prompt, imageBase64, imageMime } = await req.json();
    const ai = new GoogleGenAI({ apiKey });

    const parts: Part[] = [];

    const noTextInstruction = `IMPORTANT: Do NOT include any text, letters, words, numbers, or typography in the image. The image must be text-free. Focus only on visual elements, product, background, lighting, and composition.`;

    if (imageBase64 && imageMime) {
      parts.push({ inlineData: { data: imageBase64, mimeType: imageMime } });
      parts.push({
        text: `Based on this reference image, create a professional high-quality advertising photo: ${prompt}. Keep the same style, colors and composition. ${noTextInstruction}`,
      });
    } else {
      parts.push({
        text: `Create a professional high-quality advertising image: ${prompt}. Commercial quality, vibrant colors, modern clean design, studio lighting. ${noTextInstruction}`,
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
