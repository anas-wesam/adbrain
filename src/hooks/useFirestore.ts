"use client";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message, GeneratedImage } from "@/store/useStore";

// ── Messages ──────────────────────────────────────────────

export async function saveMessage(
  sessionId: string,
  msg: Pick<Message, "role" | "content">
) {
  await addDoc(collection(db, "sessions", sessionId, "messages"), {
    role: msg.role,
    content: msg.content,
    createdAt: serverTimestamp(),
  });
}

export async function loadMessages(sessionId: string): Promise<Message[]> {
  const q = query(
    collection(db, "sessions", sessionId, "messages"),
    orderBy("createdAt", "asc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    role: doc.data().role,
    content: doc.data().content,
    timestamp:
      doc.data().createdAt instanceof Timestamp
        ? doc.data().createdAt.toDate()
        : new Date(),
  }));
}

// ── Images ────────────────────────────────────────────────

export async function saveImageRecord(record: {
  id: string; // local UUID — used as Firestore doc ID for deduplication
  prompt: string;
  sessionId: string;
  thumbnailBase64?: string;
  storageUrl?: string;
}) {
  const ref = doc(db, "images", record.id);
  await setDoc(ref, {
    prompt: record.prompt,
    sessionId: record.sessionId,
    thumbnailBase64: record.thumbnailBase64 ?? null,
    storageUrl: record.storageUrl ?? null,
    createdAt: serverTimestamp(),
  });
  return record.id;
}

export async function updateImageRecord(
  id: string,
  updates: { storageUrl?: string }
) {
  const ref = doc(db, "images", id);
  await updateDoc(ref, updates);
}

export async function loadImages(): Promise<
  (GeneratedImage & { storageUrl?: string; thumbnailBase64?: string })[]
> {
  const q = query(
    collection(db, "images"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    prompt: doc.data().prompt,
    imageData: "",
    storageUrl: doc.data().storageUrl ?? undefined,
    thumbnailBase64: doc.data().thumbnailBase64 ?? undefined,
    timestamp:
      doc.data().createdAt instanceof Timestamp
        ? doc.data().createdAt.toDate()
        : new Date(),
  }));
}
