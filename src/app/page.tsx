"use client";
import { useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatTab from "@/components/ChatTab";
import GenerateTab from "@/components/GenerateTab";
import CampaignTab from "@/components/CampaignTab";
import GalleryTab from "@/components/GalleryTab";
import { useAppStore } from "@/store/useStore";

export default function Home() {
  const {
    messages,
    images,
    userCredits,
    activeTab,
    isLoading,
    setActiveTab,
    setIsLoading,
    addMessage,
    addImage,
    deductCredits,
  } = useAppStore();

  const handleChatSend = useCallback(
    async (text: string) => {
      if (userCredits < 1) return;
      addMessage({ role: "user", content: text });
      setIsLoading(true);
      deductCredits(1);

      try {
        const allMessages = [
          ...messages,
          { role: "user" as const, content: text },
        ];
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages }),
        });
        const data = await res.json();
        if (data.text) {
          addMessage({ role: "assistant", content: data.text });
        } else {
          addMessage({ role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى." });
        }
      } catch {
        addMessage({ role: "assistant", content: "عذراً، حدث خطأ في الاتصال." });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, userCredits, addMessage, setIsLoading, deductCredits]
  );

  const handleGenerateImage = useCallback(
    async (prompt: string) => {
      if (userCredits < 5) return null;
      setIsLoading(true);
      deductCredits(5);

      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.imageData) {
          const img = addImage({ prompt, imageData: data.imageData });
          return img;
        }
        return null;
      } catch {
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userCredits, addImage, setIsLoading, deductCredits]
  );

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} credits={userCredits} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {activeTab === "chat" && "تحدّث مع مساعدك التسويقي"}
              {activeTab === "generate" && "ولّد صور إعلانية بالذكاء الاصطناعي"}
              {activeTab === "campaign" && "أنشئ حملة تسويقية متكاملة"}
              {activeTab === "gallery" && "جميع الصور المُنشأة"}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">متصل بـ Gemini</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <ChatTab messages={messages} isLoading={isLoading} onSend={handleChatSend} />
          )}
          {activeTab === "generate" && (
            <div className="h-full overflow-y-auto">
              <GenerateTab onGenerate={handleGenerateImage} isLoading={isLoading} credits={userCredits} />
            </div>
          )}
          {activeTab === "campaign" && (
            <div className="h-full overflow-y-auto">
              <CampaignTab onGenerate={handleChatSend} isLoading={isLoading} />
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="h-full overflow-y-auto">
              <GalleryTab images={images} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
