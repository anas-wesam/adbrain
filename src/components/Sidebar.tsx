"use client";
import { cn } from "@/lib/utils";
import { ActiveTab } from "@/store/useStore";
import {
  MessageSquare,
  Image,
  Megaphone,
  GalleryHorizontalEnd,
  Zap,
  Brain,
} from "lucide-react";

const tabs = [
  { id: "generate" as ActiveTab, label: "توليد صور", icon: Image },
  { id: "gallery" as ActiveTab, label: "معرض الصور", icon: GalleryHorizontalEnd },
  { id: "chat" as ActiveTab, label: "الشات الذكي", icon: MessageSquare },
  { id: "campaign" as ActiveTab, label: "حملة إعلانية", icon: Megaphone },
];

type Props = {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  credits: number;
};

export default function Sidebar({ activeTab, setActiveTab, credits }: Props) {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">أد برين</h1>
            <p className="text-xs text-gray-400">مساعد التسويق الذكي</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all",
                activeTab === tab.id
                  ? "bg-gradient-to-l from-purple-600 to-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Credits */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">الرصيد المتاح</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{credits}</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, credits)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">كل رسالة = 1 رصيد • صورة = 5 رصيد</p>
        </div>
      </div>
    </aside>
  );
}
