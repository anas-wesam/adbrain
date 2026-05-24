"use client";
import { useState, useEffect } from "react";
import { Megaphone, Loader2, Copy, CheckCheck, Sparkles } from "lucide-react";

type TransferredData = {
  imageBase64?: string;
  adContent?: string;
};

type Props = {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  initialData?: TransferredData | null;
};

type CampaignResult = {
  tagline: string;
  facebook: string;
  instagram: string;
  twitter: string;
  email: string;
};

export default function CampaignTab({ onGenerate, isLoading, initialData }: Props) {
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("زيادة المبيعات");
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [transferred, setTransferred] = useState<TransferredData | null>(null);

  useEffect(() => {
    if (initialData) {
      setTransferred(initialData);
    }
  }, [initialData]);

  const goals = ["زيادة المبيعات", "بناء الوعي بالعلامة", "جذب متابعين", "تشجيع التجربة"];

  const handleGenerate = async () => {
    if (!brand || !product) return;
    setLoading(true);
    setResult(null);

    const prompt = `اعمل حملة تسويقية متكاملة للمعلومات التالية:
- العلامة التجارية: ${brand}
- المنتج/الخدمة: ${product}
- الجمهور المستهدف: ${audience || "عام"}
- الهدف: ${goal}

أعطني:
1. شعار إعلاني قوي (tagline)
2. بوست فيسبوك احترافي
3. كابشن إنستغرام مع هاشتاقات
4. تغريدة تويتر
5. موضوع إيميل تسويقي

اكتب كل قسم واضح ومحدد.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.text) {
        // Parse into sections
        const text: string = data.text;
        const lines = text.split("\n");
        const parsed: CampaignResult = {
          tagline: extractSection(text, ["شعار", "tagline"]),
          facebook: extractSection(text, ["فيسبوك", "facebook"]),
          instagram: extractSection(text, ["إنستغرام", "instagram"]),
          twitter: extractSection(text, ["تويتر", "twitter", "تغريدة"]),
          email: extractSection(text, ["إيميل", "email", "موضوع"]),
        };
        setResult(parsed.tagline ? parsed : { tagline: text, facebook: "", instagram: "", twitter: "", email: "" });
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">حملة إعلانية كاملة</h2>
        <p className="text-gray-500">أدخل تفاصيل مشروعك وسنولّد حملة تسويقية متكاملة</p>
      </div>

      {transferred && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">المحتوى المنقول من الشات الذكي</span>
          </div>
          {transferred.imageBase64 && (
            <img
              src={`data:image/png;base64,${transferred.imageBase64}`}
              alt="الصورة الإعلانية"
              className="w-full max-h-72 object-contain rounded-xl border border-purple-200 bg-white"
            />
          )}
          {transferred.adContent && (
            <div className="relative">
              <button
                onClick={() => { navigator.clipboard.writeText(transferred.adContent!); setCopied("transferred"); setTimeout(() => setCopied(null), 2000); }}
                className="absolute top-2 left-2 flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 transition-colors"
              >
                {copied === "transferred" ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied === "transferred" ? "تم النسخ!" : "نسخ"}
              </button>
              <p className="text-sm text-gray-700 text-right leading-relaxed whitespace-pre-wrap bg-white rounded-xl p-4 pt-8 border border-purple-100">
                {transferred.adContent}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">اسم العلامة التجارية *</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="مثال: متجر نور"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-right focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">المنتج أو الخدمة *</label>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="مثال: عباءات نسائية عصرية"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-right focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الجمهور المستهدف</label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="مثال: سيدات 25-40 سنة في السعودية"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-right focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">هدف الحملة</label>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                  goal === g
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!brand || !product || loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-40 hover:shadow-lg transition-all"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</>
          ) : (
            <><Megaphone className="w-4 h-4" /> أنشئ الحملة</>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {[
            { key: "tagline", label: "الشعار الإعلاني", emoji: "✨" },
            { key: "facebook", label: "بوست فيسبوك", emoji: "📘" },
            { key: "instagram", label: "كابشن إنستغرام", emoji: "📸" },
            { key: "twitter", label: "تغريدة تويتر", emoji: "🐦" },
            { key: "email", label: "موضوع الإيميل", emoji: "📧" },
          ].map(({ key, label, emoji }) => {
            const text = result[key as keyof CampaignResult];
            if (!text) return null;
            return (
              <div key={key} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => copyText(text, key)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    {copied === key ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied === key ? "تم النسخ!" : "نسخ"}
                  </button>
                  <span className="text-sm font-medium text-gray-700">{emoji} {label}</span>
                </div>
                <p className="text-sm text-gray-600 text-right leading-relaxed whitespace-pre-wrap">{text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function extractSection(text: string, keywords: string[]): string {
  const lines = text.split("\n");
  let capturing = false;
  let result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const isHeader = keywords.some((k) => line.includes(k)) && (line.includes(":") || line.startsWith("#") || /^\d\./.test(line.trim()));

    if (isHeader) {
      if (capturing && result.length > 0) break;
      capturing = true;
      const content = lines[i].replace(/^[\d\.\#\*]+/, "").replace(/.*:/, "").trim();
      if (content) result.push(content);
      continue;
    }

    if (capturing) {
      if (line.trim() === "" && result.length > 0) continue;
      const nextIsHeader = keywords.some((k) => line.includes(k)) && lines[i + 1]?.includes(":");
      if (/^\d\./.test(lines[i].trim()) && i > 0 && result.length > 0) {
        const otherKeywords = ["فيسبوك", "إنستغرام", "تويتر", "إيميل", "شعار", "tagline", "facebook", "instagram", "twitter", "email"].filter(k => !keywords.includes(k));
        if (otherKeywords.some(k => line.includes(k))) break;
      }
      if (lines[i].trim()) result.push(lines[i].trim());
    }
  }

  return result.join("\n").trim();
}
