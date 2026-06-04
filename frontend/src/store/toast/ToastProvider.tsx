import React, { useCallback, useMemo, useState } from "react";

import Toast from "../../components/common/Toast";

import { Ban, CircleCheck } from "lucide-react";
import {
  ToastContext,
  type ToastItem,
  type ToastOptions,
  type ToastPosition,
} from "./toastContext";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const createToast = useCallback((options: ToastOptions) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        ...options,
      },
    ]);
  }, []);

  const toast = useMemo(
    () =>
      Object.assign(createToast, {
        success: (
          content: React.ReactNode,
          options?: Omit<ToastOptions, "content">,
        ) => {
          createToast({
            content: (
              <div className="flex items-center gap-4">
                <CircleCheck className="h-5 w-5 shrink-0" />
                {content}
              </div>
            ),

            className: "bg-(--themeAccent) text-white border-none",

            ...options,
          });
        },

        error: (
          content: React.ReactNode,
          options?: Omit<ToastOptions, "content">,
        ) => {
          createToast({
            content: (
              <div className="flex items-center gap-4">
                <Ban className="h-5 w-5 shrink-0" />
                {content}
              </div>
            ),

            className: "bg-red-600/80 dark:bg-red-800 text-white border-none",

            ...options,
          });
        },
      }),
    [createToast],
  );

  const groupedToasts = toasts.reduce<Record<ToastPosition, ToastItem[]>>(
    (acc, toast) => {
      const position = toast.position ?? "bottom-right";

      acc[position].push(toast);

      return acc;
    },
    {
      "top-right": [],
      "top-left": [],
      "bottom-right": [],
      "bottom-left": [],
      "top-center": [],
      "bottom-center": [],
    },
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {Object.entries(groupedToasts).map(([position, items]) => (
        <div
          key={position}
          className={`
              fixed z-50 flex flex-col gap-3 pointer-events-none
              ${position.includes("top") ? "top-4" : "bottom-4"}
              ${position.includes("right") ? "right-4 items-end" : ""}
              ${position.includes("left") ? "left-4 items-start" : ""}
              ${
                position.includes("center")
                  ? "left-1/2 -translate-x-1/2 items-center"
                  : ""
              }
            `}
        >
          {items.map((toastItem, index) => {
            const reverseIndex = items.length - 1 - index;

            return (
              <div
                key={toastItem.id}
                className="pointer-events-auto transition-all duration-300"
                style={{
                  transform: `
          translateY(${reverseIndex * -2}px)
          scale(${1 - reverseIndex * 0.03})
        `,

                  opacity: 1 - reverseIndex * 0.12,

                  zIndex: items.length + index,
                }}
              >
                <Toast
                  className={toastItem.className}
                  duration={toastItem.duration}
                  position={toastItem.position ?? "bottom-right"}
                  onClose={() => removeToast(toastItem.id)}
                >
                  {toastItem.content}
                </Toast>
              </div>
            );
          })}
        </div>
      ))}
    </ToastContext.Provider>
  );
}
