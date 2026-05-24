"use client";
import { useState, useRef, useEffect } from "react";
import { Message } from "@/store/useStore";
import { Send, Brain, User, Loader2, Paperclip, X, ImageIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress";

type Props = {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string, imageBase64?: string, imageMime?: string) => void;
  onTransferToCampaign?: () => void;
};

export default function ChatTab({ messages, isLoading, onSend, onTransferToCampaign }: Props) {
  const [input, setInput] = useState("");
  const [previewImage, setPreviewImage] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const [meta, base64] = result.split(",");
      const mime = meta.split(":")[1].split(";")[0];
      const compressed = await compressImage(base64, mime);
      setPreviewImage({ base64: compressed.base64, mime: compressed.mime, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = () => {
    if ((!input.trim() && !previewImage) || isLoading) return;
    const text = input.trim() || "حلّل هذه الصورة وقترح محتوى تسويقي مناسب";
    onSend(text, previewImage?.base64, previewImage?.mime);
    setInput("");
    setPreviewImage(null);
  };

  const lastAssistantId = messages.filter((m) => m.role === "assistant").at(-1)?.id;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">مرحباً بك في أد برين!</h2>
            <p className="text-gray-500 max-w-md leading-relaxed">
              أنا مساعدك التسويقي الذكي. أخبرني عن علامتك التجارية أو أرسل صورة مرجعية وسأساعدك في إنشاء محتوى تسويقي احترافي.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-lg">
              {[
                "اكتبلي بوست إنستغرام لمتجر ملابس",
                "ساعدني أسمي منتجي الجديد",
                "محتاج أفكار لحملة رمضان",
                "اكتبلي وصف منتج جذاب",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSend(suggestion)}
                  className="text-right bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl p-3 text-sm text-gray-700 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
          <div
            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                msg.role === "user"
                  ? "bg-purple-600"
                  : "bg-gradient-to-br from-purple-500 to-blue-500"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Brain className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed space-y-2",
                msg.role === "user"
                  ? "bg-purple-600 text-black rounded-tl-md"
                  : "bg-gray-100 text-gray-800 rounded-tr-md"
              )}
            >
              {msg.imageBase64 && (
                <img
                  src={`data:${msg.imageMime};base64,${msg.imageBase64}`}
                  alt="صورة مرجعية"
                  className="rounded-xl max-w-[240px] max-h-[240px] object-cover"
                />
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={cn("text-xs mt-1", msg.role === "user" ? "text-purple-200" : "text-gray-400")}>
                {msg.timestamp.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          {msg.id === lastAssistantId && onTransferToCampaign && !isLoading && (
            <div className="flex pr-12 mt-2">
              <button
                onClick={onTransferToCampaign}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-md transition-all font-medium"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                نقل للحملة
              </button>
            </div>
          )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tr-md px-5 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white">
        {/* Image preview */}
        {previewImage && (
          <div className="px-4 pt-3 flex items-center gap-3">
            <div className="relative inline-block">
              <img
                src={`data:${previewImage.mime};base64,${previewImage.base64}`}
                alt="معاينة"
                className="h-16 w-16 object-cover rounded-xl border border-gray-200"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                <span>{previewImage.name}</span>
              </div>
              <p className="text-gray-400 mt-0.5">سيتم إرسال الصورة مع رسالتك إلى Gemini</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 items-end p-4">
          {/* Send */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !previewImage) || isLoading}
            className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4 text-white rotate-180" />
          </button>

          {/* Text input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={previewImage ? "اكتب تعليماتك للصورة (أو اتركه فارغاً للتحليل التلقائي)..." : "اكتب رسالتك هنا..."}
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 bg-gray-50 text-right"
            style={{ maxHeight: "120px" }}
          />

          {/* Upload image */}
          <button
            onClick={() => fileRef.current?.click()}
            title="إرفاق صورة مرجعية"
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border",
              previewImage
                ? "bg-purple-100 border-purple-300 text-purple-600"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600"
            )}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
