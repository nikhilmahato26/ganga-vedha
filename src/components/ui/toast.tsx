"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info" | "warning";
type Toast = { id: number; tone: ToastTone; title: string; body?: string };

const ToastContext = React.createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}

const TONE = {
  success: { icon: CheckCircle2, cls: "text-open", bar: "bg-open" },
  error: { icon: XCircle, cls: "text-danger", bar: "bg-danger" },
  warning: { icon: AlertTriangle, cls: "text-caution", bar: "bg-caution" },
  info: { icon: Info, cls: "text-info", bar: "bg-info" },
} as const;

/**
 * The toast's appearance, split out from the queue that manages it.
 *
 * The styleguide renders this exact component for its static specimens. A
 * hand-copied duplicate is how a specimen ends up showing a rain icon on a
 * success toast while the real component shows a tick.
 */
export function ToastCard({
  tone,
  title,
  body,
  onDismiss,
  className,
}: {
  tone: ToastTone;
  title: string;
  body?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  const { icon: Icon, cls, bar } = TONE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex w-full max-w-sm gap-3 overflow-hidden rounded-lg bg-canvas p-4 shadow-lg",
        className,
      )}
    >
      <span className={cn("w-1 shrink-0 self-stretch rounded-full", bar)} />
      <Icon className={cn("mt-0.5 size-5 shrink-0", cls)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-ink">{title}</p>
        {body && <p className="mt-0.5 text-small text-ink-muted">{body}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-granite-100 hover:text-ink"
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">Dismiss</span>
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(1);
  const viewport = React.useRef<HTMLDivElement>(null);

  /**
   * A native <dialog> opened with showModal() lives in the browser's top
   * layer, which no z-index can reach. A toast fired from inside the enquiry
   * dialog would therefore be invisible. Promoting the viewport to a manual
   * popover puts it in the top layer too, above the dialog. Browsers without
   * the popover API fall back to the z-index, which is correct everywhere the
   * toast is not competing with a modal.
   */
  React.useEffect(() => {
    const el = viewport.current;
    if (!el || toasts.length === 0) return;
    if (typeof el.showPopover !== "function") return;
    try {
      if (!el.matches(":popover-open")) el.showPopover();
    } catch {
      /* popover unsupported or already open — the z-index fallback stands */
    }
  }, [toasts.length]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { ...t, id }]);
      // Errors stay until dismissed; a person needs time to read a problem.
      if (t.tone !== "error") {
        window.setTimeout(() => dismiss(id), 5000);
      }
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        ref={viewport}
        popover="manual"
        role="region"
        aria-label="Notifications"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-auto bottom-0 left-0 m-0 flex w-full max-w-none",
          "flex-col items-center gap-2 border-0 bg-transparent p-4 pb-safe",
          "z-(--z-toast) sm:left-auto sm:w-auto sm:items-end",
        )}
      >
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            tone={t.tone}
            title={t.title}
            body={t.body}
            onDismiss={() => dismiss(t.id)}
            className="pointer-events-auto animate-[toast-in_var(--duration-base)_var(--ease-out-expo)]"
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
