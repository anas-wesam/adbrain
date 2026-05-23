"use client";
import { useState, useCallback, useEffect } from "react";
import { saveGallery, loadGallery } from "@/lib/gallery-store";
import { compressImage } from "@/lib/compress";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageBase64?: string;
  imageMime?: string;
};

export type GeneratedImage = {
  id: string;
  prompt: string;
  imageData: string; // base64
  timestamp: Date;
};

export type ActiveTab = "chat" | "generate" | "campaign" | "gallery";

let credits = 100;

export function useAppStore() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>(() => {
    // Load persisted gallery on first render (SSR-safe)
    if (typeof window === "undefined") return [];
    return loadGallery();
  });
  const [userCredits, setUserCredits] = useState(credits);
  const [activeTab, setActiveTab] = useState<ActiveTab>("generate");
  const [isLoading, setIsLoading] = useState(false);

  // Persist gallery to localStorage whenever images change
  useEffect(() => {
    if (images.length > 0) saveGallery(images);
  }, [images]);

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const newMsg: Message = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

  const addImage = useCallback(async (img: Omit<GeneratedImage, "id" | "timestamp">) => {
    // Compress image before storing to fit in localStorage (~100KB per image)
    let imageData = img.imageData;
    try {
      const compressed = await compressImage(img.imageData, "image/png", 800, 0.75);
      imageData = compressed.base64;
    } catch {
      // use original if compression fails
    }

    const newImg: GeneratedImage = {
      ...img,
      imageData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setImages((prev) => [newImg, ...prev]);
    return newImg;
  }, []);

  const deductCredits = useCallback((amount: number) => {
    credits = Math.max(0, credits - amount);
    setUserCredits(credits);
  }, []);

  return {
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
    setMessages,
  };
}
