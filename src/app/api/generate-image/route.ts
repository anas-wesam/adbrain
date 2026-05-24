import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ai = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API key");
  return new GoogleGenAI({ apiKey });
};

async function describeImage(imageBase64: string, imageMime: string): Promise<string> {
  const response = await ai().models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: imageMime as "image/jpeg" | "image/png" | "image/webp", data: imageBase64 } },
        { text: "Describe this product image for use as a reference in an AI image generator. Include colors, shape, materials, textures, and key visual details. 2-3 sentences maximum. Only describe what you see." }
      ]
    }]
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function buildEditPrompt(userPrompt: string, imageDesc: string): Promise<string> {
  const response = await ai().models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{
      role: "user",
      parts: [{
        text: `You are writing an image generation prompt. Combine the product description and the requested edit into one detailed prompt.

Product description: "${imageDesc}"
Requested edit: "${userPrompt}"

Write a single image generation prompt (under 3 sentences) that describes the product with the edits applied. Include advertising context, studio lighting, and high quality. Output only the prompt, nothing else.`
      }]
    }]
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || `${imageDesc} ${userPrompt}`;
}

async function enhancePrompt(userPrompt: string): Promise<string> {
  const response = await ai().models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{
      role: "user",
      parts: [{
        text: `Convert this Arabic advertising request into a detailed English image generation prompt. Include visual details, lighting, style, and quality cues. Keep it under 3 sentences.

Request: "${userPrompt}"

Output only the English prompt, nothing else.`
      }]
    }]
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userPrompt;
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
  if (!imageUrl) throw new Error("No image URL from Together AI");
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Failed to fetch generated image");
  const buffer = await imgRes.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function POST(req: NextRequest) {
  const { prompt, imageBase64, imageMime } = await req.json();

  try {
    if (imageBase64 && imageMime) {
      // Describe reference image with Gemini Vision, then build edit prompt
      let imageDesc = "";
      try {
        imageDesc = await describeImage(imageBase64, imageMime);
        console.log("Image description:", imageDesc);
      } catch (e) {
        console.warn("Gemini vision failed:", e);
      }

      let finalPrompt = prompt;
      try {
        finalPrompt = imageDesc
          ? await buildEditPrompt(prompt, imageDesc)
          : await enhancePrompt(prompt);
        console.log("Final prompt:", finalPrompt);
      } catch {
        console.warn("Prompt building failed, using original");
        finalPrompt = imageDesc ? `${imageDesc} ${prompt}` : prompt;
      }

      const imageData = await generateWithFlux(finalPrompt);
      return NextResponse.json({ imageData });
    }

    // Text-to-image path
    let textPrompt = prompt;
    try {
      textPrompt = await enhancePrompt(prompt);
    } catch {
      textPrompt = `${prompt}. Professional advertising photo, no people, no humans, studio lighting, high quality.`;
    }

    const imageData = await generateWithFlux(textPrompt);
    return NextResponse.json({ imageData });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
