import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

interface ToastProps {
  children: React.ReactNode;
  className?: string;
  duration?: number | null;
  position?: ToastPosition;
  onClose?: () => void;
  closable?: boolean;
}

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const animationClasses: Record<
  ToastPosition,
  {
    hidden: string;
    visible: string;
    exit: string;
  }
> = {
  'top-right': {
    hidden: 'opacity-0 translate-x-20 scale-95',
    visible: 'opacity-100 translate-x-0 scale-100',
    exit: 'opacity-0 translate-x-20 scale-95',
  },

  'bottom-right': {
    hidden: 'opacity-0 translate-x-20 scale-95',
    visible: 'opacity-100 translate-x-0 scale-100',
    exit: 'opacity-0 translate-x-20 scale-95',
  },

  'top-left': {
    hidden: 'opacity-0 -translate-x-20 scale-95',
    visible: 'opacity-100 translate-x-0 scale-100',
    exit: 'opacity-0 -translate-x-20 scale-95',
  },

  'bottom-left': {
    hidden: 'opacity-0 -translate-x-20 scale-95',
    visible: 'opacity-100 translate-x-0 scale-100',
    exit: 'opacity-0 -translate-x-20 scale-95',
  },

  'top-center': {
    hidden: 'opacity-0 -translate-y-20 scale-95',
    visible: 'opacity-100 translate-y-0 scale-100',
    exit: 'opacity-0 -translate-y-20 scale-95',
  },

  'bottom-center': {
    hidden: 'opacity-0 translate-y-20 scale-95',
    visible: 'opacity-100 translate-y-0 scale-100',
    exit: 'opacity-0 translate-y-20 scale-95',
  },
};

export default function Toast({
  children,
  className = '',
  duration = 3000,
  position = 'bottom-right',
  onClose,
  closable = true,
}: ToastProps) {
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const animation = animationClasses[position];

  const closeWithAnimation = () => {
    setClosing(true);

    setTimeout(() => {
      onClose?.();
    }, 200);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (duration === null) return;

    const timer = setTimeout(() => {
      closeWithAnimation();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      className={twMerge(
        'min-w-40 fixed z-50 group border bg-(--foreground) text-(--primaryText) border-(--border) px-4 py-3 rounded-xl shadow flex items-start gap-3',
        positionClasses[position],
        className,

        'transition-all duration-300 ease-in-out',

        !mounted && animation.hidden,
        mounted && !closing && animation.visible,
        closing && animation.exit,
      )}
    >
      <div className='flex-1'>{children}</div>

      {closable && (
        <button
          onClick={closeWithAnimation}
          className='absolute -top-2 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-neutral-700 text-white border border-(--border) shadow-md opacity-0 group-hover:opacity-100 transition'
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
