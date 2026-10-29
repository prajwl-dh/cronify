import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, X } from "lucide-react";

type ToastTone = "success" | "error" | "neutral";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "neutral") => {
      const id = ++counter.current;
      setToasts((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((item) => (
          <div
            className={`toast toast-${item.tone}`}
            key={item.id}
            role="status"
          >
            <span className="toast-icon" aria-hidden="true">
              {item.tone === "error" ? (
                <AlertTriangle size={14} />
              ) : item.tone === "success" ? (
                <Check size={14} />
              ) : (
                <span className="toast-dot" />
              )}
            </span>
            <span>{item.message}</span>
            <button
              className="toast-close"
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss message"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
