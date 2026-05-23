import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Part } from "@google/genai";

export const maxDuration = 60;

/** Pollinations AI — free, no API key required */
async function generateWithPollinations(prompt: string): Promise<string> {
  const fullPrompt = `${prompt}. Professional advertising photo, high quality, cinematic lighting, sharp details, 4K.`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/** Try Gemini image generation with a specific model; returns base64 string or throws */
async function generateWithGeminiModel(
  apiKey: string,
  model: string,
  prompt: string,
  imageBase64?: string,
  imageMime?: string
): Promise<string> {
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
    model,
    contents: [{ role: "user", parts }],
    config: { responseModalities: ["IMAGE", "TEXT"] },
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  const imgPart = responseParts.find((p: Part) => p.inlineData);
  if (!imgPart?.inlineData?.data) throw new Error("No image in Gemini response");
  return imgPart.inlineData.data;
}

export async function POST(req: NextRequest) {
  const { prompt, imageBase64, imageMime } = await req.json();
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const hasValidKey = apiKey && apiKey !== "your_google_ai_api_key_here";

  // Gemini models to try in order (free tier first)
  const geminiModels = [
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash-image",
  ];

  try {
    if (hasValidKey) {
      for (const model of geminiModels) {
        try {
          const imageData = await generateWithGeminiModel(apiKey!, model, prompt, imageBase64, imageMime);
          console.log(`Image generated with ${model}`);
          return NextResponse.json({ imageData });
        } catch (err) {
          console.warn(`${model} failed:`, err);
          // Try next model ↓
        }
      }
    }

    // Final fallback: Pollinations AI (free, no key needed)
    console.warn("All Gemini models failed, using Pollinations");
    const imageData = await generateWithPollinations(prompt);
    return NextResponse.json({ imageData });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في توليد الصورة. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
