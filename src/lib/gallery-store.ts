import { GeneratedImage } from "@/store/useStore";

const KEY = "adbrain_gallery";
const MAX_IMAGES = 30;

type StoredImage = Omit<GeneratedImage, "timestamp"> & { timestamp: string };

export function saveGallery(images: GeneratedImage[]) {
  try {
    const stored: StoredImage[] = images.slice(0, MAX_IMAGES).map((img) => ({
      ...img,
      timestamp: img.timestamp.toISOString(),
    }));
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // localStorage full — remove oldest and retry
    try {
      const stored: StoredImage[] = images.slice(0, 10).map((img) => ({
        ...img,
        timestamp: img.timestamp.toISOString(),
      }));
      localStorage.setItem(KEY, JSON.stringify(stored));
    } catch {
      // ignore
    }
  }
}

export function loadGallery(): GeneratedImage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const stored: StoredImage[] = JSON.parse(raw);
    return stored.map((img) => ({
      ...img,
      timestamp: new Date(img.timestamp),
    }));
  } catch {
    return [];
  }
}
