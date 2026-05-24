"use client";
import { useCallback, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatTab from "@/components/ChatTab";
import GenerateTab from "@/components/GenerateTab";
import CampaignTab from "@/components/CampaignTab";
import GalleryTab from "@/components/GalleryTab";
import StoreTab from "@/components/StoreTab";
import { useAppStore, GeneratedImage } from "@/store/useStore";
import { saveMessage, saveImageRecord, updateImageRecord } from "@/hooks/useFirestore";
import { uploadBase64Image } from "@/hooks/useStorage";
import { compressImage } from "@/lib/compress";

const SESSION_ID = "session_" + Math.random().toString(36).slice(2, 10);

export default function Home() {
  const sessionId = useRef(SESSION_ID).current;
  const [campaignData, setCampaignData] = useState<{ imageBase64?: string; adContent?: string } | null>(null);
  const [storeProductRef, setStoreProductRef] = useState<{ base64: string; mime: string; name: string } | null>(null);

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
    async (text: string, imageBase64?: string, imageMime?: string) => {
      if (userCredits < 1) return;
      addMessage({ role: "user", content: text, imageBase64, imageMime });
      setIsLoading(true);
      deductCredits(1);

      saveMessage(sessionId, { role: "user", content: text }).catch(() => {});

      try {
        const allMessages = [
          ...messages,
          { role: "user" as const, content: text },
        ];
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages, imageBase64, imageMime }),
        });
        const data = await res.json();
        const replyText = data.text || data.error || "عذراً، حدث خطأ. حاول مرة أخرى.";
        addMessage({ role: "assistant", content: replyText });
        saveMessage(sessionId, { role: "assistant", content: replyText }).catch(() => {});
      } catch {
        addMessage({ role: "assistant", content: "عذراً، حدث خطأ في الاتصال." });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, userCredits, addMessage, setIsLoading, deductCredits, sessionId]
  );

  const handleGenerateImage = useCallback(
    async (prompt: string, imageBase64?: string, imageMime?: string) => {
      if (userCredits < 5) return null;
      setIsLoading(true);
      deductCredits(5);

      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, imageBase64, imageMime }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.imageData) {
          const img = await addImage({ prompt, imageData: data.imageData });

          const thumb = await compressImage(data.imageData, "image/png", 400, 0.5);
          saveImageRecord({ id: img.id, prompt, sessionId, thumbnailBase64: thumb.base64 })
            .then(() => {
              uploadBase64Image(data.imageData, `${img.id}.png`)
                .then((storageUrl) => updateImageRecord(img.id, { storageUrl }))
                .catch(() => {});
            })
            .catch(() => {});

          return img;
        }
        throw new Error("لم يتم إرجاع صورة من الخادم");
      } catch (err) {
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userCredits, addImage, setIsLoading, deductCredits, sessionId]
  );

  const handleSendToChat = useCallback(
    async (imageBase64: string, imagePrompt: string) => {
      setActiveTab("chat");

      const metaPrompt = `لدي هذه الصورة الإعلانية (${imagePrompt}).

أريد منك إنشاء كل ما يلزم لإعلان Meta (فيسبوك وإنستغرام) احترافي يشمل:

1. **العنوان الرئيسي (Headline)** — جملة قصيرة جذابة (أقل من 40 حرف)
2. **النص الأساسي (Primary Text)** — 2-3 جمل مقنعة تبدأ بخطاف انتباه قوي
3. **الوصف (Description)** — جملة واحدة تدعم العنوان
4. **نداء للفعل (CTA)** — مثل: اطلب الآن / تسوق الآن / احجز مجاناً
5. **هاشتاقات** — 10 هاشتاقات عربية وإنجليزية مناسبة
6. **جمهور مقترح** — الفئة العمرية، الاهتمامات، الموقع الجغرافي

اكتب كل قسم بوضوح ومنظم.`;

      // Compress generated image before sending to chat (1.5MB → ~150KB)
      const compressed = await compressImage(imageBase64, "image/png", 800, 0.7);

      setTimeout(() => {
        handleChatSend(metaPrompt, compressed.base64, compressed.mime);
      }, 300);
    },
    [setActiveTab, handleChatSend]
  );

  const handleStoreProduct = useCallback(async (imageUrl: string, productName: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const [meta, base64] = dataUrl.split(",");
        const mime = meta.split(":")[1].split(";")[0];
        const { compressImage } = await import("@/lib/compress");
        const compressed = await compressImage(base64, mime);
        setStoreProductRef({ base64: compressed.base64, mime: compressed.mime, name: productName });
        setActiveTab("generate");
      };
      reader.readAsDataURL(blob);
    } catch {
      setActiveTab("generate");
    }
  }, [setActiveTab]);

  const handleTransferToCampaign = useCallback(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const lastUserWithImage = [...messages].reverse().find((m) => m.role === "user" && m.imageBase64);
    setCampaignData({
      imageBase64: lastUserWithImage?.imageBase64,
      adContent: lastAssistant?.content,
    });
    setActiveTab("campaign");
  }, [messages, setActiveTab]);

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
              {activeTab === "store" && "منتجات متجر إيزي أوردر"}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">متصل بـ Gemini</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <ChatTab messages={messages} isLoading={isLoading} onSend={handleChatSend as (text: string, imageBase64?: string, imageMime?: string) => void} onTransferToCampaign={handleTransferToCampaign} />
          )}
          {activeTab === "generate" && (
            <div className="h-full overflow-y-auto">
              <GenerateTab
                onGenerate={handleGenerateImage as (prompt: string, imageBase64?: string, imageMime?: string) => Promise<GeneratedImage | null>}
                onSendToChat={handleSendToChat}
                isLoading={isLoading}
                credits={userCredits}
                externalRefImage={storeProductRef}
              />
            </div>
          )}
          {activeTab === "campaign" && (
            <div className="h-full overflow-y-auto">
              <CampaignTab onGenerate={handleChatSend} isLoading={isLoading} initialData={campaignData} />
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="h-full overflow-y-auto">
              <GalleryTab images={images} />
            </div>
          )}
          {activeTab === "store" && (
            <div className="h-full overflow-y-auto">
              <StoreTab onGenerateAd={handleStoreProduct} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
