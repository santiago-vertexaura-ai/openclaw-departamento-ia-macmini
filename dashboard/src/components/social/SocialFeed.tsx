"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

interface FeedItem {
  id: string;
  title: string;
  author: string;
  doc_type: string;
  tags: string[];
  created_at: string;
  word_count: number;
  monitoredAccount?: string | null;
}

const ACCOUNT_COLORS: Record<string, string> = {
  "santim.ia": "#E4405F",
  racklabs: "#3B82F6",
  mattganzak: "#22C55E",
};

export default function SocialFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/feed");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getAccountTag = (tags: string[]) => {
    const accounts = ["santim.ia", "racklabs", "mattganzak"];
    return tags?.find((t) => accounts.includes(t.toLowerCase())) || null;
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.round(diff / 3600000);
    if (hours < 1) return "Hace menos de 1h";
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.round(hours / 24)}d`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Feed de Investigacion
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-blue-400 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm">Cargando feed...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm">
          Sin documentos de investigacion recientes
        </div>
      ) : (
        items.map((item) => {
          const account = item.monitoredAccount || getAccountTag(item.tags);
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[#27272A] p-4 hover:border-[#3F3F46] transition-all"
              style={{ background: "#141416" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {account && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: ACCOUNT_COLORS[account] || "#fff",
                        background: `${ACCOUNT_COLORS[account] || "#fff"}15`,
                      }}
                    >
                      @{account}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-600">{timeAgo(item.created_at)}</span>
                </div>
                <span className="text-[10px] text-zinc-600">{item.word_count} palabras</span>
              </div>
              <p className="text-[13px] text-zinc-200 mb-3 line-clamp-2">{item.title}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {item.tags
                    ?.filter((t) => !["santim.ia", "racklabs", "mattganzak", "instagram", "auto"].includes(t.toLowerCase()))
                    .slice(0, 3)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("createContent", { detail: { docId: item.id } }));
                  }}
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Sparkles size={11} />
                  Crear Contenido
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
