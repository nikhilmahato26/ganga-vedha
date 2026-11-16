import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-semibold " +
  "whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] " +
  "duration-[--duration-fast] ease-[--ease-out-quart] " +
  "active:translate-y-px disabled:pointer-events-none " +
  // Loading keeps full opacity — a dimmed button reads as unavailable, and
  // "working" must never look the same as "you cannot do this".
  "disabled:not-aria-busy:opacity-45 aria-busy:cursor-progress";

/* Elevation is declared once per surface: filled buttons carry a shadow and no
   border; outline and ghost carry a border and no shadow. */
const variants: Record<Variant, string> = {
  primary:
    "on-ember bg-cta text-white shadow-sm hover:bg-cta-hover hover:shadow-md " +
    "focus-visible:outline-granite-950",
  secondary:
    "bg-jade-700 text-white shadow-sm hover:bg-jade-800 hover:shadow-md",
  outline:
    "bg-canvas text-ink border border-granite-300 hover:border-granite-400 hover:bg-granite-50",
  ghost: "bg-transparent text-ink hover:bg-granite-100",
  danger: "bg-danger text-white shadow-sm hover:brightness-110 hover:shadow-md",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-sm px-3.5 text-small",
  md: "h-11 rounded-md px-5 text-small",
  lg: "h-13 rounded-md px-7 text-subtitle",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Shown while `loading`; falls back to the button's own label. */
  loadingLabel?: string;
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      loadingLabel,
      block = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
        {...props}
      >
        {/* The label keeps its box while loading so the button never resizes. */}
        <span
          className={cn(
            "inline-flex items-center gap-2",
            loading && "invisible",
          )}
        >
          {children}
        </span>
        {loading && (
          <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {loadingLabel && <span>{loadingLabel}</span>}
          </span>
        )}
      </button>
    );
  },
);

/** Anchor styled as a button — for links that navigate rather than act. */
export interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton(
    { className, variant = "primary", size = "md", block = false, ...props },
    ref,
  ) {
    return (
      <a
        ref={ref}
        className={cn(
          base,
          "no-underline",
          variants[variant],
          sizes[size],
          block && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
