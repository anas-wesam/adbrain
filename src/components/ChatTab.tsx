"use client";
import { useState, useRef, useEffect } from "react";
import { Message } from "@/store/useStore";
import { Send, Brain, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
};

export default function ChatTab({ messages, isLoading, onSend }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

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
              أنا مساعدك التسويقي الذكي. أخبرني عن علامتك التجارية وسأساعدك في إنشاء محتوى تسويقي احترافي.
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
          <div
            key={msg.id}
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
                "max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-tl-md"
                  : "bg-gray-100 text-gray-800 rounded-tr-md"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={cn("text-xs mt-1", msg.role === "user" ? "text-purple-200" : "text-gray-400")}>
                {msg.timestamp.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
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
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-3 items-end">
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4 text-white rotate-180" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="اكتب رسالتك هنا..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 bg-gray-50 text-right"
            style={{ maxHeight: "120px" }}
          />
        </div>
      </div>
    </div>
  );
}
