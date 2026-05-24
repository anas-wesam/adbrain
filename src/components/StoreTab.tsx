"use client";
import { useState, useEffect } from "react";
import { Store, Link, Loader2, Wand2, RefreshCw, AlertCircle, ShoppingBag } from "lucide-react";

type Product = {
  id: number | string;
  title?: string;
  name?: string;
  price?: string | number;
  images?: string[];
  thumbnail?: string;
  image?: string;
};

type Props = {
  onGenerateAd: (imageUrl: string, productName: string) => void;
};

const LS_KEY = "store_url";

export default function StoreTab({ onGenerateAd }: Props) {
  const [storeUrl, setStoreUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setStoreUrl(saved);
  }, []);

  const fetchProducts = async (url: string, pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/easy-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: url, page: pageNum }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const list: Product[] = data.products || [];
      const lastPage = data.meta?.last_page || data.pagination?.total_pages || 1;

      setProducts(pageNum === 1 ? list : (prev) => [...prev, ...list]);
      setHasMore(pageNum < lastPage && data.source === "api");
      setConnected(true);
      localStorage.setItem(LS_KEY, url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في الاتصال");
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!storeUrl.trim()) return;
    let url = storeUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    setStoreUrl(url);
    setPage(1);
    fetchProducts(url, 1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(storeUrl, next);
  };

  const getProductImage = (p: Product): string | null => {
    if (p.images && p.images.length > 0) return p.images[0];
    if (p.thumbnail) return p.thumbnail;
    if (p.image) return p.image;
    return null;
  };

  const getProductName = (p: Product) => p.title || p.name || `منتج #${p.id}`;

  const handleGenerateAd = (product: Product) => {
    const imgUrl = getProductImage(product);
    if (!imgUrl) return;
    setGeneratingId(product.id);
    onGenerateAd(imgUrl, getProductName(product));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ربط المتجر</h2>
        <p className="text-gray-500">أدخل رابط متجرك لاستيراد منتجاتك وتوليد إعلانات تلقائياً</p>
      </div>

      {/* URL Input */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1 text-right">رابط المتجر</label>
        <p className="text-xs text-gray-400 mb-3 text-right">مثال: https://mystore.easy-orders.net</p>
        <div className="flex gap-2">
          <button
            onClick={handleConnect}
            disabled={!storeUrl.trim() || loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 hover:shadow-lg transition-all flex-shrink-0"
          >
            {loading && !connected ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            {connected ? "تحديث" : "ربط المتجر"}
          </button>
          <input
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            placeholder="https://متجرك.easy-orders.net"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none focus:border-purple-400"
            dir="ltr"
          />
        </div>

        {connected && (
          <div className="flex items-center gap-2 mt-3 text-green-600 text-sm">
            <Store className="w-4 h-4" />
            <span>تم الربط — {products.length} منتج</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {products.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => fetchProducts(storeUrl, 1)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث
            </button>
            <p className="text-sm font-medium text-gray-700">منتجات المتجر</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => {
              const imgUrl = getProductImage(product);
              const name = getProductName(product);
              return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={name}
                      className="w-full h-40 object-cover bg-gray-50"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-800 text-right line-clamp-2 mb-1">{name}</p>
                    {product.price && (
                      <p className="text-xs text-purple-600 font-bold text-right mb-3">{product.price}</p>
                    )}
                    <button
                      onClick={() => handleGenerateAd(product)}
                      disabled={!imgUrl}
                      className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-xl text-xs font-medium disabled:opacity-40 hover:shadow-md transition-all"
                    >
                      {generatingId === product.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      ولّد إعلان
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              تحميل المزيد
            </button>
          )}
        </div>
      )}

      {!connected && !loading && products.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 flex flex-col items-center text-center">
          <Store className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-400">أدخل رابط متجرك لعرض المنتجات</p>
        </div>
      )}
    </div>
  );
}
