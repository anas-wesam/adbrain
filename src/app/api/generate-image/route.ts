import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

async function enhancePrompt(userPrompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return userPrompt;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{
      role: "user",
      parts: [{
        text: `Convert this advertising request into a clear image editing instruction for an AI image editor. Be specific about what visual changes to make (background, text, badges, colors, lighting). Keep it under 2 sentences. Do NOT mention keeping the product - just describe what to ADD or CHANGE.

Request: "${userPrompt}"

Output only the editing instruction in English, nothing else.`
      }]
    }]
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userPrompt;
}

async function generateWithKontext(prompt: string, inputImageBase64: string): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("No Together API key");

  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-kontext-dev",
      prompt,
      image_url: `data:image/jpeg;base64,${inputImageBase64}`,
      width: 1024,
      height: 1024,
      steps: 28,
      n: 1,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || JSON.stringify(data) || "Together Kontext error");
  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image URL from Together Kontext");
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Failed to fetch output image");
  const buffer = await imgRes.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function generateWithFlux(prompt: string): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("No Together API key");

  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt,
      width: 1024,
      height: 1024,
      steps: 4,
      n: 1,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Together error");
  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image URL");
  const imgRes = await fetch(imageUrl);
  const buffer = await imgRes.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function POST(req: NextRequest) {
  const { prompt, imageBase64, imageMime } = await req.json();

  try {
    if (imageBase64 && imageMime) {
      let enhancedPrompt = prompt;
      try {
        enhancedPrompt = await enhancePrompt(prompt);
        console.log("Enhanced prompt:", enhancedPrompt);
      } catch {
        console.warn("Gemini enhance failed, using original prompt");
      }
      const imageData = await generateWithKontext(enhancedPrompt, imageBase64);
      return NextResponse.json({ imageData });
    }

    // Text-to-image: use Together AI FLUX schnell
    const imageData = await generateWithFlux(
      `${prompt}. Professional advertising photo, no people, no humans, studio lighting, high quality.`
    );
    return NextResponse.json({ imageData });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
