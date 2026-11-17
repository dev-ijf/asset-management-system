"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";
type Toast = { id: number; message: string; variant: ToastVariant };
type ToastContextValue = { showToast: (message: string, variant?: ToastVariant) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => dismiss(id), variant === "error" ? 6500 : 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? AlertCircle : Info;
          return (
            <div key={toast.id} role={toast.variant === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${styles[toast.variant]}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Tutup notifikasi" className="rounded p-0.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus digunakan di dalam ToastProvider.");
  return context;
}

export function useActionFeedback(state: { ok?: boolean; message?: string; errors?: { form?: string } }) {
  const { showToast } = useToast();
  const lastState = useRef<typeof state | undefined>(undefined);
  const message = state.errors?.form ?? state.message;
  useEffect(() => {
    if (!message || lastState.current === state) return;
    lastState.current = state;
    showToast(message, state.ok ? "success" : "error");
  }, [message, showToast, state, state.ok]);
}
