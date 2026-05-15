import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function Button({
  children,
  className,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      {...props}
      className={twMerge(
        'rounded-2xl border border-(--border) px-2 py-1 md:p-2 outline-none',
        className,
      )}
    >
      {children}
    </button>
  );
}
