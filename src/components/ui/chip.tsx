import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "jade"
  | "ember"
  | "open"
  | "closed"
  | "caution"
  | "danger"
  | "info"
  | "easy"
  | "moderate"
  | "challenging"
  | "onMedia";

const tones: Record<Tone, string> = {
  neutral: "bg-granite-100 text-granite-800",
  jade: "bg-jade-100 text-jade-800",
  ember: "bg-ember-50 text-ember-700",
  /* Availability is FILLED. Grade is soft-tinted. That structural difference
     is what keeps "Challenging" from ever reading as "Bookings closed". */
  open: "bg-open text-white",
  closed: "bg-closed text-white",
  caution: "bg-caution-soft text-caution",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  easy: "bg-grade-easy-soft text-grade-easy",
  moderate: "bg-grade-moderate-soft text-grade-moderate",
  challenging: "bg-grade-challenging-soft text-grade-challenging",
  /* Sits on photography: opaque enough to stay legible over any frame. */
  onMedia: "bg-granite-950/78 text-white backdrop-blur-[2px]",
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export function Chip({
  className,
  tone = "neutral",
  icon,
  size = "md",
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        size === "sm" ? "h-6 px-2.5 text-caption" : "h-7 px-3 text-small",
        tones[tone],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0 [&>svg]:size-3.5">{icon}</span>}
      {children}
    </span>
  );
}

const GRADE_TONE = {
  easy: "easy",
  moderate: "moderate",
  challenging: "challenging",
} as const;

const GRADE_LABEL = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
} as const;

/**
 * Grade owns a colour by law — but never travels without its word, so the
 * meaning survives colour blindness and a greyscale print.
 */
export function GradeChip({
  grade,
  size = "md",
  onMedia = false,
  className,
}: {
  grade: keyof typeof GRADE_LABEL;
  size?: "sm" | "md";
  onMedia?: boolean;
  className?: string;
}) {
  return (
    <Chip
      tone={onMedia ? "onMedia" : GRADE_TONE[grade]}
      size={size}
      className={className}
    >
      {GRADE_LABEL[grade]}
    </Chip>
  );
}
