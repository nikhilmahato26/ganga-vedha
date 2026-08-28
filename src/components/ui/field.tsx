"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-md border bg-canvas text-ink placeholder:text-ink-faint " +
  "transition-[border-color,box-shadow] duration-[--duration-fast] " +
  "disabled:cursor-not-allowed disabled:bg-canvas-sunk disabled:text-ink-faint " +
  "border-granite-300 hover:border-granite-400 " +
  "focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20";

const controlSize = "min-h-11 px-3.5 py-2.5 text-body";

const FieldContext = React.createContext<{
  id: string;
  describedBy?: string;
  invalid: boolean;
} | null>(null);

function useField() {
  const ctx = React.useContext(FieldContext);
  if (!ctx) throw new Error("Input, Select and Textarea must be used inside <Field>.");
  return ctx;
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  /** The problem, named. Never "Invalid input". */
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={id} className="text-small font-semibold text-ink">
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden>
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        {children}
        {error ? (
          <p
            id={errorId}
            className="flex items-start gap-1.5 text-small text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="text-small text-ink-faint">
              {hint}
            </p>
          )
        )}
      </div>
    </FieldContext.Provider>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  const { id, describedBy, invalid } = useField();
  return (
    <input
      ref={ref}
      id={id}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, controlSize, className)}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  const { id, describedBy, invalid } = useField();
  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "px-3.5 py-2.5 text-body resize-y", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  const { id, describedBy, invalid } = useField();
  return (
    <div className="relative">
      <select
        ref={ref}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, controlSize, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-faint"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="m4 6 4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});
