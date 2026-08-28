"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const box =
  "peer size-5 shrink-0 appearance-none rounded-[5px] border-2 border-granite-300 bg-canvas " +
  "transition-[background-color,border-color] duration-[--duration-fast] " +
  "checked:border-jade-700 checked:bg-jade-700 indeterminate:border-jade-700 indeterminate:bg-jade-700 " +
  "hover:border-granite-400 checked:hover:bg-jade-800 " +
  "disabled:cursor-not-allowed disabled:border-granite-200 disabled:bg-granite-100";

/** Row wrapper giving every control a 44px target and a clickable label. */
function Row({
  children,
  description,
  label,
  htmlFor,
  disabled,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-11 items-start gap-3 py-1.5">
      <span className="relative mt-0.5 grid place-items-center">{children}</span>
      <label
        htmlFor={htmlFor}
        className={cn(
          "cursor-pointer select-none",
          disabled && "cursor-not-allowed text-ink-faint",
        )}
      >
        <span className="block text-small font-semibold text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-small text-ink-muted">{description}</span>
        )}
      </label>
    </div>
  );
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  indeterminate?: boolean;
}) {
  const id = React.useId();
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <Row label={label} description={description} htmlFor={id} disabled={props.disabled}>
      <input ref={ref} id={id} type="checkbox" className={cn(box, className)} {...props} />
      {indeterminate ? (
        <Minus className="pointer-events-none absolute size-3.5 text-white" aria-hidden />
      ) : (
        <Check
          className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100"
          aria-hidden
        />
      )}
    </Row>
  );
}

export function Radio({
  label,
  description,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <Row label={label} description={description} htmlFor={id} disabled={props.disabled}>
      <input
        id={id}
        type="radio"
        className={cn(box, "rounded-full checked:bg-canvas", className)}
        {...props}
      />
      <span
        className="pointer-events-none absolute size-2.5 rounded-full bg-jade-700 opacity-0 peer-checked:opacity-100"
        aria-hidden
      />
    </Row>
  );
}

/**
 * A switch, not a checkbox: used where the change takes effect immediately —
 * publishing a hotel, opening or closing bookings. Anything that needs a Save
 * button should be a Checkbox instead.
 */
export function Switch({
  label,
  description,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="flex min-h-11 items-start justify-between gap-4 py-1.5">
      <label
        htmlFor={id}
        className={cn(
          "cursor-pointer select-none",
          props.disabled && "cursor-not-allowed text-ink-faint",
        )}
      >
        <span className="block text-small font-semibold text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-small text-ink-muted">{description}</span>
        )}
      </label>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className={cn(
            "peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-granite-300",
            "transition-colors duration-[--duration-fast] checked:bg-jade-700",
            "disabled:cursor-not-allowed disabled:opacity-45",
            className,
          )}
          {...props}
        />
        <span
          className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-canvas shadow-sm transition-transform duration-[--duration-fast] ease-[--ease-out-quart] peer-checked:translate-x-5"
          aria-hidden
        />
      </span>
    </div>
  );
}
