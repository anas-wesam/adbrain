"use client";
import { useRef, useState } from "react";
import { GeneratedImage } from "@/store/useStore";
import { ImageIcon, Loader2, Download, Wand2, Paperclip, X, Sparkles } from "lucide-react";

type Props = {
  onGenerate: (prompt: string, imageBase64?: string, imageMime?: string) => Promise<GeneratedImage | null>;
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
  const [refImage, setRefImage] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [meta, base64] = result.split(",");
      const mime = meta.split(":")[1].split(";")[0];
      setRefImage({ base64, mime, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading || credits < 5) return;
    setError("");
    const img = await onGenerate(prompt.trim(), refImage?.base64, refImage?.mime);
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
        <p className="text-gray-500">صف فكرتك بالعربي — مع أو بدون صورة مرجعية</p>
      </div>

      {/* Reference Image Upload */}
      <div className="mb-4">
        {refImage ? (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={`data:${refImage.mime};base64,${refImage.base64}`}
                alt="صورة مرجعية"
                className="w-20 h-20 object-cover rounded-xl border border-purple-200"
              />
              <button
                onClick={() => setRefImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">صورة مرجعية مرفقة</span>
              </div>
              <p className="text-xs text-purple-500">{refImage.name}</p>
              <p className="text-xs text-gray-400 mt-1">Gemini سيحلل الصورة ويولّد بناءً عليها</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-2xl p-5 flex items-center justify-center gap-3 transition-all group"
          >
            <div className="w-10 h-10 bg-gray-100 group-hover:bg-purple-100 rounded-xl flex items-center justify-center transition-colors">
              <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">أضف صورة مرجعية (اختياري)</p>
              <p className="text-xs text-gray-400">منتجك، لوجوك، أو أي تصميم تريد الاستلهام منه</p>
            </div>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Prompt Input */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            refImage
              ? "صف ما تريد إنشاءه بناءً على الصورة... مثال: اعمل إعلاناً لنفس المنتج بخلفية بيضاء"
              : "مثال: إعلان عطر فاخر، خلفية ذهبية، جودة عالية..."
          }
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
                {refImage ? "Gemini يحلل الصورة..." : "جاري التوليد..."}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                {refImage ? "ولّد بناءً على المرجع" : "ولّد الصورة"}
              </>
            )}
          </button>
          <span className="text-xs text-gray-400">5 رصيد • رصيدك: {credits}</span>
        </div>
      </div>

      {/* Suggestions — only when no ref image */}
      {!refImage && (
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
      )}

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
          <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-400">ستظهر الصورة المولّدة هنا</p>
        </div>
      )}
    </div>
  );
}
