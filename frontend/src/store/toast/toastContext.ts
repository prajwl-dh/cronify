import { createContext } from 'react';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export type ToastOptions = {
  content: React.ReactNode;
  className?: string;
  duration?: number | null;
  position?: ToastPosition;
};

export type ToastItem = ToastOptions & {
  id: number;
};

type ToastFn = {
  (options: ToastOptions): void;

  success: (
    content: React.ReactNode,
    options?: Omit<ToastOptions, 'content'>,
  ) => void;

  error: (
    content: React.ReactNode,
    options?: Omit<ToastOptions, 'content'>,
  ) => void;
};

export type ToastContextType = {
  toast: ToastFn;
};

export const ToastContext = createContext<ToastContextType | null>(null);
