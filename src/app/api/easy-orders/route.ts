import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { storeUrl, page = 1 } = await req.json();
  if (!storeUrl) return NextResponse.json({ error: "رابط المتجر مطلوب" }, { status: 400 });

  // Normalize URL
  let base = storeUrl.trim().replace(/\/$/, "");
  if (!base.startsWith("http")) base = "https://" + base;

  try {
    const res = await fetch(
      `https://api.easy-orders.net/api/v1/products?page=${page}`,
      {
        headers: {
          "Referer": base + "/",
          "Origin": base,
          "Accept": "*/*",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "تعذّر الاتصال بالمتجر" }, { status: res.status });
    }

    const data = await res.json();

    // Normalize response format
    let products: unknown[] = [];
    let totalPages = 1;
    let total = 0;

    if (Array.isArray(data)) {
      products = data;
    } else {
      products = data.data || [];
      totalPages = data.totalPages || 1;
      total = data.total || products.length;
    }

    if (!products.length) {
      return NextResponse.json({ error: "لم يتم العثور على منتجات في هذا المتجر" }, { status: 404 });
    }

    return NextResponse.json({ products, totalPages, total, page });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
