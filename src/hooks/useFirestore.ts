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
  prompt: string;
  storageUrl: string;
  sessionId: string;
}) {
  const docRef = await addDoc(collection(db, "images"), {
    prompt: record.prompt,
    storageUrl: record.storageUrl,
    sessionId: record.sessionId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function loadImages(): Promise<
  (GeneratedImage & { storageUrl?: string })[]
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
    storageUrl: doc.data().storageUrl,
    timestamp:
      doc.data().createdAt instanceof Timestamp
        ? doc.data().createdAt.toDate()
        : new Date(),
  }));
}
