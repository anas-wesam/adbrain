import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

function getAI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API key");
  return new GoogleGenAI({ apiKey });
}

async function enhancePrompt(userPrompt: string, imageDesc?: string): Promise<string> {
  const ai = getAI();
  const context = imageDesc ? `Product: ${imageDesc}\nEdit request: ${userPrompt}` : userPrompt;
  const instruction = imageDesc
    ? `Combine this product description and edit request into one detailed English image generation prompt. Include the product, the requested changes, studio lighting, high quality. Under 3 sentences. Output only the prompt.`
    : `Convert this Arabic advertising request into a detailed English image generation prompt. Include visual details, lighting, style. Under 3 sentences. Output only the prompt.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: `${instruction}\n\n${context}` }] }]
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userPrompt;
}

async function describeImage(imageBase64: string, imageMime: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: imageMime as "image/jpeg" | "image/png" | "image/webp", data: imageBase64 } },
        { text: "Describe this product image for AI image generation reference. Include colors, shape, materials, textures, and key visual details. 2 sentences max. Only describe what you see." }
      ]
    }]
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function generateWithCloudflare(prompt: string, imageBase64: string): Promise<string> {
  const token = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;
  if (!token || !accountId) throw new Error("No Cloudflare credentials");

  // Convert base64 image to array of bytes for Cloudflare Workers AI
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const imageArray = Array.from(imageBuffer);

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image: imageArray,
        strength: 0.35,
        num_steps: 20,
        guidance: 7.5,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare AI error: ${err.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function generateWithFlux(prompt: string): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("No Together API key");

  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
      // Describe reference image with Gemini Vision
      let imageDesc = "";
      try {
        imageDesc = await describeImage(imageBase64, imageMime);
        console.log("Image desc:", imageDesc);
      } catch (e) {
        console.warn("Gemini vision failed:", e);
      }

      // Build enhanced prompt
      let finalPrompt = prompt;
      try {
        finalPrompt = await enhancePrompt(prompt, imageDesc || undefined);
        console.log("Final prompt:", finalPrompt);
      } catch {
        finalPrompt = imageDesc ? `${imageDesc}. ${prompt}` : prompt;
      }

      // Generate with Cloudflare img2img (preserves structure of original)
      const imageData = await generateWithCloudflare(finalPrompt, imageBase64);
      return NextResponse.json({ imageData });
    }

    // Text-to-image: enhance prompt then use FLUX Schnell
    let textPrompt = prompt;
    try {
      textPrompt = await enhancePrompt(prompt);
    } catch {
      textPrompt = `${prompt}. Professional advertising photo, no people, studio lighting, high quality.`;
    }

    const imageData = await generateWithFlux(textPrompt);
    return NextResponse.json({ imageData });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
