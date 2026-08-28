"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Built on the native <dialog>, which gives focus trapping, Escape-to-close,
 * inertness of the page behind it, and the top layer for free — all of which
 * hand-rolled modals get wrong. We add: a labelled close control, backdrop
 * click-to-dismiss that ignores drags started inside the panel, and a scroll
 * lock that does not shift the layout when the scrollbar disappears.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Set false for a blocking notice the visitor must acknowledge. */
  dismissible?: boolean;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const pointerDownInPanel = React.useRef(false);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      onPointerDown={(e) => {
        pointerDownInPanel.current = e.target !== e.currentTarget;
      }}
      onClick={(e) => {
        // Only a press that both started and ended on the backdrop dismisses,
        // so selecting text and releasing outside never closes the dialog.
        if (dismissible && !pointerDownInPanel.current && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={cn(
        "m-auto w-[calc(100vw-2rem)] rounded-lg bg-canvas p-0 text-ink shadow-xl",
        "z-(--z-overlay)",
        "backdrop:bg-granite-950/55 backdrop:backdrop-blur-[3px]",
        "open:animate-[modal-in_var(--duration-base)_var(--ease-out-expo)]",
        size === "sm" && "max-w-md",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-2xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <h2 id={titleId} className="text-title text-ink">
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1.5 text-small text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-1.5 grid size-9 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-granite-100 hover:text-ink"
          >
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>

      {children && <div className="px-6 py-5">{children}</div>}

      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-hairline bg-canvas-sunk px-6 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </dialog>
  );
}
