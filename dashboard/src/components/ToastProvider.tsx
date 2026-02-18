"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  navigateTo?: { tab: string };
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: "border-emerald-500/30", icon: "text-emerald-400", bg: "bg-emerald-500/5" },
  error: { border: "border-red-500/30", icon: "text-red-400", bg: "bg-red-500/5" },
  info: { border: "border-blue-500/30", icon: "text-blue-400", bg: "bg-blue-500/5" },
  warning: { border: "border-amber-500/30", icon: "text-amber-400", bg: "bg-amber-500/5" },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = toast.duration ?? 5000;
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]); // Keep max 5

    const timer = setTimeout(() => removeToast(id), duration);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container — bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          const style = STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl animate-slideUp ${style.border} ${style.bg} ${toast.navigateTo ? "cursor-pointer hover:brightness-110" : ""}`}
              style={{ background: "rgba(20,20,22,0.95)" }}
              onClick={() => {
                if (toast.navigateTo) {
                  window.dispatchEvent(new CustomEvent("switchTab", { detail: toast.navigateTo.tab }));
                  removeToast(toast.id);
                }
              }}
            >
              <Icon size={16} className={`${style.icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
                className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
