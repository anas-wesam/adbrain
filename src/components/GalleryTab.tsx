"use client";
import { useEffect, useState } from "react";
import { GeneratedImage } from "@/store/useStore";
import { Download, GalleryHorizontalEnd, Loader2, RefreshCw } from "lucide-react";
import { loadImages } from "@/hooks/useFirestore";

type FirestoreImage = {
  id: string;
  prompt: string;
  storageUrl?: string;
  thumbnailBase64?: string;
  timestamp: Date;
};

type Props = {
  images: GeneratedImage[]; // local session images (instant preview)
};

export default function GalleryTab({ images: localImages }: Props) {
  const [firestoreImages, setFirestoreImages] = useState<FirestoreImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = () => {
    setLoading(true);
    loadImages()
      .then((imgs) => {
        // Accept images that have either a storageUrl or a thumbnailBase64
        const valid = imgs.filter(
          (i) => (i as FirestoreImage).storageUrl || (i as FirestoreImage).thumbnailBase64
        ) as unknown as FirestoreImage[];
        setFirestoreImages(valid);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchImages();
  }, [localImages.length]);

  const firestoreIds = new Set(firestoreImages.map((i) => i.id));

  // Local images not yet saved to Firestore (just generated this session)
  const localOnly = localImages.filter((i) => !firestoreIds.has(i.id));

  const handleDownload = (src: string, id: string) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `adbrain-${id}.png`;
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

  const totalCount = firestoreImages.length + localOnly.length;

  if (totalCount === 0) {
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
        <button onClick={fetchImages} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 transition-colors">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{totalCount} صورة</span>
          <h2 className="text-2xl font-bold text-gray-800">معرض الصور</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Firestore images (persisted) */}
        {firestoreImages.map((img) => {
          const src = img.storageUrl ?? `data:image/jpeg;base64,${img.thumbnailBase64}`;
          return (
            <ImageCard
              key={img.id}
              src={src}
              prompt={img.prompt}
              onDownload={() => handleDownload(src, img.id)}
            />
          );
        })}

        {/* Local-only images (just generated, uploading) */}
        {localOnly.map((img) => (
          <ImageCard
            key={img.id}
            src={`data:image/png;base64,${img.imageData}`}
            prompt={img.prompt}
            uploading
            onDownload={() => handleDownload(`data:image/png;base64,${img.imageData}`, img.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ImageCard({ src, prompt, onDownload, uploading }: {
  src: string;
  prompt: string;
  onDownload: () => void;
  uploading?: boolean;
}) {
  return (
    <div className="group relative bg-gray-100 rounded-2xl overflow-hidden aspect-square">
      <img src={src} alt={prompt} className="w-full h-full object-cover" />

      {uploading && (
        <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin text-white" />
          <span className="text-white text-xs">جاري الحفظ</span>
        </div>
      )}

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          تحميل
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-xs truncate text-right">{prompt}</p>
      </div>
    </div>
  );
}
