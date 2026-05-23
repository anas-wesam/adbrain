"use client";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadBase64Image(
  base64: string,
  filename: string
): Promise<string> {
  const storageRef = ref(storage, `generated-images/${filename}`);
  await uploadString(storageRef, base64, "base64", {
    contentType: "image/png",
  });
  const url = await getDownloadURL(storageRef);
  return url;
}
