"use client";
import { useEffect, useState } from "react";
import { GeneratedImage } from "@/store/useStore";
import { Download, GalleryHorizontalEnd, Loader2 } from "lucide-react";
import { loadImages } from "@/hooks/useFirestore";

type GalleryImage = GeneratedImage & { storageUrl?: string };

type Props = {
  images: GeneratedImage[];
};

export default function GalleryTab({ images: localImages }: Props) {
  const [firestoreImages, setFirestoreImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages()
      .then(setFirestoreImages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [localImages.length]);

  const getImageSrc = (img: GalleryImage) => {
    if (img.storageUrl) return img.storageUrl;
    if (img.imageData) return `data:image/png;base64,${img.imageData}`;
    return "";
  };

  // Merge: Firestore images + local-only images (not yet saved)
  const firestoreIds = new Set(firestoreImages.map((i) => i.id));
  const localOnly = localImages.filter((i) => !firestoreIds.has(i.id));
  const allImages: GalleryImage[] = [...firestoreImages, ...localOnly];

  const handleDownload = (img: GalleryImage) => {
    const src = getImageSrc(img);
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `adbrain-${img.id}.png`;
    a.target = "_blank";
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (allImages.length === 0) {
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
        <span className="text-sm text-gray-400">{allImages.length} صورة</span>
        <h2 className="text-2xl font-bold text-gray-800">معرض الصور</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allImages.map((img) => {
          const src = getImageSrc(img);
          return (
            <div key={img.id} className="group relative bg-gray-100 rounded-2xl overflow-hidden aspect-square">
              {src ? (
                <img src={src} alt={img.prompt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
          );
        })}
      </div>
    </div>
  );
}
