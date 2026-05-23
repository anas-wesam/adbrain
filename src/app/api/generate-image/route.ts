import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey || apiKey === "your_google_ai_api_key_here") {
    return NextResponse.json(
      { error: "GOOGLE_AI_API_KEY غير مضبوطة." },
      { status: 400 }
    );
  }

  try {
    const { prompt, imageBase64, imageMime } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);

    let finalPrompt: string;

    if (imageBase64 && imageMime) {
      // Step 1: Gemini analyzes reference image + user prompt → enhanced Imagen prompt
      const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const parts: Part[] = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageMime,
          },
        },
        {
          text: `أنت خبير في توليد صور إعلانية احترافية.
حلّل هذه الصورة المرجعية وأنشئ prompt احترافي باللغة الإنجليزية لـ Imagen لتوليد صورة إعلانية بناءً على:
- طلب المستخدم: "${prompt}"
- الأسلوب والألوان والتكوين في الصورة المرجعية

اكتب فقط الـ prompt الإنجليزي، بدون أي شرح أو مقدمة. يجب أن يكون وصفاً دقيقاً ومفصلاً لا يتجاوز 3 جمل.`,
        },
      ];

      const visionResult = await visionModel.generateContent(parts);
      finalPrompt = visionResult.response.text().trim();
    } else {
      // No reference image — build prompt directly
      finalPrompt = `Professional Arabic marketing advertisement: ${prompt}. High quality commercial photography, vibrant colors, modern clean design, studio lighting.`;
    }

    // Step 2: Generate image with Imagen
    const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (imageModel as any).generateImages({
      prompt: finalPrompt,
      numberOfImages: 1,
      aspectRatio: "1:1",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageData = (result as any).generatedImages[0].image.imageBytes;
    const base64 = Buffer.from(imageData).toString("base64");

    return NextResponse.json({ imageData: base64, usedPrompt: finalPrompt });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في توليد الصورة. تأكد من صلاحيات API Key." },
      { status: 500 }
    );
  }
}
