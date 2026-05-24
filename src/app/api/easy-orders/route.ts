import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

type Product = {
  id: string | number;
  title?: string;
  name?: string;
  price?: string | number;
  images?: string[];
  thumbnail?: string;
  image?: string;
};

function normalizeProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const list = d.data || d.products || d.items || d.result;
    if (Array.isArray(list)) return list as Product[];
  }
  return [];
}

async function tryJsonEndpoints(base: string, page: number): Promise<Product[] | null> {
  const endpoints = [
    `${base}/api/v1/external-apps/products?page=${page}&per_page=20`,
    `${base}/api/products?page=${page}`,
    `${base}/products.json?page=${page}`,
    `${base}/api/v1/products?page=${page}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("json")) continue;
      const data = await res.json();
      const products = normalizeProducts(data);
      if (products.length > 0) return products;
    } catch {
      continue;
    }
  }
  return null;
}

async function scrapeProducts(base: string): Promise<Product[]> {
  const res = await fetch(base, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AdBrain/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error("تعذّر فتح رابط المتجر");
  const html = await res.text();

  // Extract product cards using regex patterns common in e-commerce stores
  const products: Product[] = [];

  // Try to find JSON-LD product data
  const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const json = JSON.parse(match[1]);
      const items = json["@graph"] || (Array.isArray(json) ? json : [json]);
      for (const item of items) {
        if (item["@type"] === "Product") {
          const img = item.image?.url || item.image?.[0] || item.image;
          products.push({
            id: item.sku || item.productID || products.length + 1,
            title: item.name,
            price: item.offers?.price || item.offers?.[0]?.price,
            images: img ? [img] : [],
          });
        }
      }
    } catch { continue; }
  }

  if (products.length > 0) return products;

  // Fallback: find og:image and title as single product
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1];
  if (ogImage) {
    products.push({ id: 1, title: ogTitle || "منتج المتجر", images: [ogImage] });
  }

  return products;
}

export async function POST(req: NextRequest) {
  const { storeUrl, page = 1 } = await req.json();
  if (!storeUrl) return NextResponse.json({ error: "رابط المتجر مطلوب" }, { status: 400 });

  const base = storeUrl.replace(/\/$/, "").trim();

  try {
    // 1. Try known JSON API endpoints
    const fromApi = await tryJsonEndpoints(base, page);
    if (fromApi) return NextResponse.json({ products: fromApi, source: "api" });

    // 2. Fallback: scrape HTML
    if (page === 1) {
      const scraped = await scrapeProducts(base);
      if (scraped.length > 0) return NextResponse.json({ products: scraped, source: "scrape" });
    }

    return NextResponse.json({ error: "لم يتم العثور على منتجات في هذا الرابط" }, { status: 404 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
