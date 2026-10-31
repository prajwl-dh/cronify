import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, ChevronDown, Loader2, RefreshCw, X } from "lucide-react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${className}`.trim()}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="spin" size={14} aria-hidden="true" />
        ) : (
          icon
        )}
        {children ? <span>{children}</span> : null}
      </button>
    );
  },
);

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tone?: "default" | "danger";
};

export function IconButton({
  label,
  children,
  tone = "default",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn ${tone === "danger" ? "icon-btn-danger" : ""} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

type PillTone = "neutral" | "positive" | "negative" | "warning" | "muted";

export function Pill({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: PillTone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`pill pill-${tone}`}>
      {dot ? <span className="pill-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {children ? <p className="empty-copy">{children}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <span className="error-icon" aria-hidden="true">
        <AlertTriangle size={15} />
      </span>
      <div>
        <p className="error-title">Couldn’t load this data.</p>
        <p className="error-copy">{message}</p>
      </div>
      {onRetry ? (
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={13} />}
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className = "", ...props }, ref) {
  return <input ref={ref} className={`input ${className}`.trim()} {...props} />;
});

export type DropdownOption = { value: string; label: string };

/**
 * Custom listbox used everywhere a native <select> would show the browser's
 * own menu. Keyboard, focus and type-ahead come from Headless UI; the button
 * and menu are ours.
 */
export function Dropdown({
  value,
  onChange,
  options,
  label,
  id,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label: string;
  id?: string;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className={`dropdown ${className}`.trim()}>
      <Listbox value={value} onChange={onChange}>
        <ListboxButton id={id} className="dropdown-button" aria-label={label}>
          <span className="dropdown-value">{selected?.label ?? value}</span>
          <ChevronDown
            size={14}
            className="dropdown-chevron"
            aria-hidden="true"
          />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          className="menu dropdown-menu"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="menu-item dropdown-option"
            >
              {({ selected: isSelected }) => (
                <>
                  <span className="dropdown-option-label">{option.label}</span>
                  {isSelected ? <Check size={13} aria-hidden="true" /> : null}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onCancel}
      className="dialog-root"
    >
      <div className="dialog-backdrop" aria-hidden="true" />
      <div className="dialog-wrap">
        <DialogPanel className="dialog dialog-small">
          <div className="dialog-head">
            <DialogTitle className="dialog-title">{title}</DialogTitle>
            <IconButton label="Close dialog" onClick={onCancel} disabled={busy}>
              <X size={15} />
            </IconButton>
          </div>
          <div className="dialog-body">
            <p className="confirm-copy">{description}</p>
          </div>
          <div className="dialog-foot">
            <Button variant="ghost" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={onConfirm}
              loading={busy}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
