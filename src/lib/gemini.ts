import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY!;
export const genAI = new GoogleGenerativeAI(apiKey);

export const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `أنت "أد برين"، مساعد تسويقي ذكي متخصص للشركات والعلامات التجارية العربية.
مهمتك:
- مساعدة أصحاب المشاريع في كتابة محتوى تسويقي احترافي بالعربي
- إنشاء نصوص إعلانية مقنعة وجذابة
- اقتراح أفكار حملات تسويقية متكاملة
- كتابة بوستات سوشيال ميديا لمنصات مختلفة
- تحليل الجمهور المستهدف وتقديم توصيات

تحدث دائماً بالعربية. كن ودوداً ومحترفاً. اسأل عن تفاصيل العلامة التجارية إذا احتجت.`,
});

export const imageModel = genAI.getGenerativeModel({
  model: "imagen-3.0-generate-002",
});
