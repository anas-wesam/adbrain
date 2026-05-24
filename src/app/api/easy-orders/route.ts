import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { apiKey, page = 1 } = await req.json();
  if (!apiKey) return NextResponse.json({ error: "مفتاح API مطلوب" }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.easy-orders.net/api/v1/external-apps/products?page=${page}&per_page=20`,
      { headers: { "Api-Key": apiKey, "Accept": "application/json" } }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "خطأ في الاتصال بإيزي أوردر" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
