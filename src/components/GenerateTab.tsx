"use client";
import { useRef, useState } from "react";
import { GeneratedImage } from "@/store/useStore";
import { ImageIcon, Loader2, Download, Wand2, Paperclip, X, Sparkles, Type, MessageSquare } from "lucide-react";
import { compressImage } from "@/lib/compress";

type Props = {
  onGenerate: (prompt: string, imageBase64?: string, imageMime?: string) => Promise<GeneratedImage | null>;
  onSendToChat: (imageBase64: string, prompt: string) => void;
  isLoading: boolean;
  credits: number;
};

const suggestions = [
  "منتج عطر فاخر على خلفية ذهبية",
  "مطعم عربي أصيل بإضاءة دافئة",
  "متجر إلكتروني للملابس النسائية",
  "مخبوزات طازجة وقهوة عربية",
];

const overlayPositions = [
  { id: "top", label: "أعلى" },
  { id: "center", label: "وسط" },
  { id: "bottom", label: "أسفل" },
] as const;

type OverlayPosition = "top" | "center" | "bottom";

export default function GenerateTab({ onGenerate, onSendToChat, isLoading, credits }: Props) {
  const [prompt, setPrompt] = useState("");
  const [lastImage, setLastImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState("");
  const [refImage, setRefImage] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [overlayPos, setOverlayPos] = useState<OverlayPosition>("bottom");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const [meta, base64] = result.split(",");
      const mime = meta.split(":")[1].split(";")[0];
      // Compress to max 1024px to stay under Vercel's 4.5MB body limit
      const compressed = await compressImage(base64, mime);
      setRefImage({ base64: compressed.base64, mime: compressed.mime, name: file.name });
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

  // Draw image + Arabic text overlay on canvas then download
  const handleDownload = () => {
    if (!lastImage) return;

    if (!overlayText.trim()) {
      // No overlay — download raw image
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${lastImage.imageData}`;
      a.download = `adbrain-${Date.now()}.png`;
      a.click();
      return;
    }

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Overlay band height
      const bandH = Math.round(img.height * 0.14);
      const bandY =
        overlayPos === "top" ? 0
        : overlayPos === "center" ? Math.round((img.height - bandH) / 2)
        : img.height - bandH;

      // Semi-transparent band
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, bandY, img.width, bandH);

      // Arabic text — right-aligned
      const fontSize = Math.round(bandH * 0.42);
      ctx.font = `bold ${fontSize}px Cairo, Arial, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.direction = "rtl";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(overlayText, img.width - 24, bandY + bandH / 2, img.width - 48);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `adbrain-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = `data:image/png;base64,${lastImage.imageData}`;
  };

  const imageSrc = lastImage ? `data:image/png;base64,${lastImage.imageData}` : null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">توليد صور إعلانية</h2>
        <p className="text-gray-500">صف فكرتك — مع أو بدون صورة مرجعية</p>
      </div>

      {/* Reference Image */}
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

      {/* Prompt */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={refImage ? "صف ما تريد بناءً على الصورة... مثال: نفس المنتج بخلفية بيضاء" : "مثال: إعلان عطر فاخر، خلفية ذهبية، جودة عالية..."}
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
              <><Loader2 className="w-4 h-4 animate-spin" />{refImage ? "Gemini يحلل..." : "جاري التوليد..."}</>
            ) : (
              <><Wand2 className="w-4 h-4" />{refImage ? "ولّد بناءً على المرجع" : "ولّد الصورة"}</>
            )}
          </button>
          <span className="text-xs text-gray-400">5 رصيد • رصيدك: {credits}</span>
        </div>
      </div>

      {/* Suggestions */}
      {!refImage && (
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">اقتراحات سريعة:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setPrompt(s)}
                className="text-xs bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 px-3 py-1.5 rounded-lg transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-600 text-sm text-right">{error}</div>
      )}

      {/* Generated Image */}
      {imageSrc && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
          {/* Preview with live text overlay */}
          <div className="relative">
            <img src={imageSrc} alt="صورة مولّدة" className="w-full object-cover" />
            {overlayText.trim() && (
              <div className={`absolute left-0 right-0 bg-black/55 px-4 py-3 flex items-center justify-end
                ${overlayPos === "top" ? "top-0" : overlayPos === "center" ? "top-1/2 -translate-y-1/2" : "bottom-0"}`}>
                <p className="text-white font-bold text-lg text-right leading-snug"
                  style={{ fontFamily: "Cairo, Arial, sans-serif", direction: "rtl" }}>
                  {overlayText}
                </p>
              </div>
            )}
          </div>

          {/* Text overlay controls */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="w-4 h-4 text-purple-600" />
              <span>أضف نص عربي فوق الصورة</span>
            </div>
            <input
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="مثال: خصم ٥٠٪ | اطلب الآن"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-right focus:outline-none focus:border-purple-400"
              dir="rtl"
            />
            {overlayText.trim() && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">موضع النص:</span>
                {overlayPositions.map((p) => (
                  <button key={p.id} onClick={() => setOverlayPos(p.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${overlayPos === p.id ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-1 gap-3">
              <p className="text-xs text-gray-400 truncate flex-1">{lastImage?.prompt}</p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => lastImage && onSendToChat(lastImage.imageData, lastImage.prompt)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  ولّد إعلان
                </button>
                <button onClick={handleDownload}
                  className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium">
                  <Download className="w-4 h-4" />
                  تحميل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!lastImage && !isLoading && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 flex flex-col items-center text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-400">ستظهر الصورة المولّدة هنا</p>
        </div>
      )}

      {/* Hidden canvas for text compositing on download */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
