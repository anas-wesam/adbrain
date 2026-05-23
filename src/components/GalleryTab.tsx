"use client";
import { GeneratedImage } from "@/store/useStore";
import { Download, GalleryHorizontalEnd, Trash2 } from "lucide-react";

type Props = {
  images: GeneratedImage[];
};

export default function GalleryTab({ images }: Props) {
  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${img.imageData}`;
    a.download = `adbrain-${img.id}.png`;
    a.click();
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
          <GalleryHorizontalEnd className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">المعرض فاضي لسه</h2>
        <p className="text-gray-400 text-sm">الصور اللي بتولّدها هتتحفظ هنا تلقائياً</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-400">{images.length} صورة</span>
        <h2 className="text-2xl font-bold text-gray-800">معرض الصور</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-gray-100 rounded-2xl overflow-hidden aspect-square">
            <img
              src={`data:image/png;base64,${img.imageData}`}
              alt={img.prompt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
              <button
                onClick={() => handleDownload(img)}
                className="flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                تحميل
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-xs truncate text-right">{img.prompt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
