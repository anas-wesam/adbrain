"use client";
import { useState, useCallback } from "react";

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
  imageData: string;
  timestamp: Date;
};

export type ActiveTab = "chat" | "generate" | "campaign" | "gallery" | "store";

let credits = 100;

export function useAppStore() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [userCredits, setUserCredits] = useState(credits);
  const [activeTab, setActiveTab] = useState<ActiveTab>("generate");
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const newMsg: Message = { ...msg, id: crypto.randomUUID(), timestamp: new Date() };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

  const addImage = useCallback((img: Omit<GeneratedImage, "id" | "timestamp">) => {
    const newImg: GeneratedImage = { ...img, id: crypto.randomUUID(), timestamp: new Date() };
    setImages((prev) => [newImg, ...prev]);
    return newImg;
  }, []);

  const deductCredits = useCallback((amount: number) => {
    credits = Math.max(0, credits - amount);
    setUserCredits(credits);
  }, []);

  return {
    messages, images, userCredits, activeTab, isLoading,
    setActiveTab, setIsLoading, addMessage, addImage, deductCredits, setMessages,
  };
}
