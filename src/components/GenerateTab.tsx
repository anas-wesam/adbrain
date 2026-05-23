"use client";
import { useState } from "react";
import { GeneratedImage } from "@/store/useStore";
import { Image, Loader2, Download, Wand2 } from "lucide-react";

type Props = {
  onGenerate: (prompt: string) => Promise<GeneratedImage | null>;
  isLoading: boolean;
  credits: number;
};

const suggestions = [
  "منتج عطر فاخر على خلفية ذهبية",
  "مطعم عربي أصيل بإضاءة دافئة",
  "متجر إلكتروني للملابس النسائية",
  "مخبوزات طازجة وقهوة عربية",
];

export default function GenerateTab({ onGenerate, isLoading, credits }: Props) {
  const [prompt, setPrompt] = useState("");
  const [lastImage, setLastImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading || credits < 5) return;
    setError("");
    const img = await onGenerate(prompt.trim());
    if (img) setLastImage(img);
    else setError("حدث خطأ في توليد الصورة. حاول مرة أخرى.");
  };

  const handleDownload = () => {
    if (!lastImage) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${lastImage.imageData}`;
    a.download = `adbrain-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">توليد صور إعلانية</h2>
        <p className="text-gray-500">صف فكرتك بالعربي وسنولد لك صورة إعلانية احترافية</p>
      </div>

      {/* Prompt Input */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="مثال: إعلان عطر فاخر، خلفية ذهبية، جودة عالية..."
          rows={3}
          className="w-full resize-none text-right text-sm focus:outline-none text-gray-700 placeholder-gray-400"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading || credits < 5}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                ولّد الصورة
              </>
            )}
          </button>
          <span className="text-xs text-gray-400">5 رصيد لكل صورة • رصيدك: {credits}</span>
        </div>
      </div>

      {/* Suggestions */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-2">اقتراحات سريعة:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="text-xs bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 px-3 py-1.5 rounded-lg transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-600 text-sm text-right">
          {error}
        </div>
      )}

      {/* Generated Image */}
      {lastImage && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <img
            src={`data:image/png;base64,${lastImage.imageData}`}
            alt="صورة مولّدة"
            className="w-full object-cover"
          />
          <div className="p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 truncate flex-1 ml-3">{lastImage.prompt}</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              <Download className="w-4 h-4" />
              تحميل
            </button>
          </div>
        </div>
      )}

      {!lastImage && !isLoading && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 flex flex-col items-center text-center">
          <Image className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-400">ستظهر الصورة المولّدة هنا</p>
        </div>
      )}
    </div>
  );
}
