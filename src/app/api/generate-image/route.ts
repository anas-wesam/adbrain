import { NextRequest, NextResponse } from "next/server";
import { genAI } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const enhancedPrompt = `Professional Arabic marketing advertisement image: ${prompt}. High quality, commercial photography style, vibrant colors, modern design.`;

    const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (imageModel as any).generateImages({
      prompt: enhancedPrompt,
      numberOfImages: 1,
      aspectRatio: "1:1",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageData = (result as any).generatedImages[0].image.imageBytes;
    const base64 = Buffer.from(imageData).toString("base64");

    return NextResponse.json({ imageData: base64 });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في توليد الصورة. تأكد من صلاحيات API Key." },
      { status: 500 }
    );
  }
}
