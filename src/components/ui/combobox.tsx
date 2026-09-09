"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFieldControl } from "./field";

/**
 * A searchable picker for lists too long to be a <select> and too structured
 * to be a text box.
 *
 * Built to the WAI-ARIA editable-combobox pattern: the input owns the
 * `combobox` role, the popup is a `listbox` of grouped `option`s, and the
 * active option is pointed at with `aria-activedescendant` rather than moving
 * focus, so the keyboard never leaves the input.
 *
 * `allowFreeText` keeps the old text box alive underneath: if the guest wants
 * something we do not list, what they typed is still a valid answer instead of
 * a dead end.
 */

export type ComboboxOption = {
  id: string;
  label: string;
  /** The one line under the label. */
  meta?: string | null;
  /** Short state word shown as a chip, e.g. "Closed". */
  tag?: string | null;
  /** Extra words the row should match on but never shows. */
  keywords?: string;
};

export type ComboboxGroup = {
  label: string;
  /** Filter-chip wording, where the heading's full label is too long. */
  shortLabel?: string;
  options: ComboboxOption[];
};

export function Combobox({
  groups,
  selected,
  onSelect,
  text,
  onTextChange,
  placeholder,
  allowFreeText = false,
  freeTextLabel = "Use what I typed",
  emptyLabel = "Nothing matches that",
  filterable = false,
  allLabel = "All",
  className,
}: {
  groups: ComboboxGroup[];
  /** The picked option, or null when the value is free text (or nothing). */
  selected: ComboboxOption | null;
  onSelect: (option: ComboboxOption | null) => void;
  /** What is in the box while nothing is picked. */
  text: string;
  onTextChange: (value: string) => void;
  placeholder?: string;
  allowFreeText?: boolean;
  freeTextLabel?: string;
  emptyLabel?: string;
  /**
   * Show a row of group filters at the top of the popup. Worth it once the
   * catalogue is long enough that scanning every group to reach the rentals
   * is the slow path.
   */
  filterable?: boolean;
  allLabel?: string;
  className?: string;
}) {
  const { id, describedBy, invalid } = useFieldControl();
  const listId = `${id}-listbox`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  /** Group the guest has narrowed to, or null for everything. */
  const [scope, setScope] = React.useState<string | null>(null);
  /** What the guest has typed since they last picked something. */
  const query = selected ? "" : text;

  /** Query first, so the filter row can grey out what the query already rules out. */
  const results = React.useMemo(
    () => filterGroups(groups, query),
    [groups, query],
  );

  const visible = React.useMemo(
    () => (scope ? results.filter((g) => g.label === scope) : results),
    [results, scope],
  );

  /**
   * The flat, keyboard-navigable order. The free-text row is a real option at
   * the end of it, so Enter picks it exactly like any listing.
   */
  const FREE_TEXT_ID = "__free-text__";
  const flat = React.useMemo(() => {
    const rows = visible.flatMap((g) => g.options);
    const trimmed = query.trim();
    const exact = rows.some(
      (o) => o.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (allowFreeText && trimmed.length > 0 && !exact) {
      rows.push({ id: FREE_TEXT_ID, label: trimmed, meta: freeTextLabel });
    }
    return rows;
  }, [visible, query, allowFreeText, freeTextLabel]);

  // A filtered list invalidates the old cursor: reset to the first row so
  // Enter always picks the best match rather than whatever index survived.
  React.useEffect(() => {
    setActive(0);
  }, [query, scope]);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active row in view when the cursor is moved by keyboard.
  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function commit(option: ComboboxOption) {
    if (option.id === FREE_TEXT_ID) {
      onSelect(null);
      onTextChange(option.label);
    } else {
      onSelect(option);
    }
    setOpen(false);
    inputRef.current?.focus();
  }

  /**
   * Narrowing is a decision, not a destination: focus goes back to the input
   * so the next keystroke searches within the type just chosen, and the
   * arrow keys still walk the results.
   */
  function narrow(group: string | null) {
    setScope(group);
    inputRef.current?.focus();
  }

  function clear() {
    onSelect(null);
    onTextChange("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (flat.length === 0) return;
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((i) => (i + step + flat.length) % flat.length);
        return;
      }
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        return;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(flat.length - 1);
        }
        return;
      case "Enter":
        // Never let the picker's Enter submit the form around it.
        if (open && flat[active]) {
          e.preventDefault();
          commit(flat[active]);
        }
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
    }
  }

  /**
   * Tab is deliberately left alone so it can walk from the input into the
   * filter row, which lives inside the popup. The popup is dismissed when
   * focus leaves the control altogether, not when it leaves the input.
   */
  function onBlurCapture(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && rootRef.current?.contains(next)) return;
    setOpen(false);
  }

  const activeId = open && flat[active] ? `${id}-opt-${flat[active].id}` : undefined;
  const showClear = Boolean(selected || text);

  return (
    <div ref={rootRef} onBlur={onBlurCapture} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          value={selected ? selected.label : text}
          placeholder={placeholder}
          onChange={(e) => {
            if (selected) onSelect(null);
            onTextChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full rounded-md border bg-canvas py-2.5 pr-20 pl-10 text-body text-ink",
            "min-h-11 placeholder:text-ink-faint",
            "transition-[border-color,box-shadow] duration-[--duration-fast]",
            "border-granite-300 hover:border-granite-400",
            "focus:border-jade-600 focus:ring-2 focus:ring-jade-600/25 focus:outline-none",
            "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
          )}
        />

        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center">
          {showClear && (
            <button
              type="button"
              onClick={clear}
              className="grid size-9 place-items-center rounded-md text-ink-faint hover:bg-granite-100 hover:text-ink"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Clear selection</span>
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => {
              setOpen((o) => !o);
              inputRef.current?.focus();
            }}
            className="grid size-9 place-items-center rounded-md text-ink-faint hover:text-ink"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-[--duration-fast]",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%+0.375rem)] right-0 left-0 z-(--z-raised)",
            // Wider than the field once there is room for it: the field sits
            // in a two-column grid, and a half-width panel turns the filter
            // row into a scroller nobody scrolls.
            "sm:right-auto sm:w-[max(100%,30rem)]",
            "flex max-h-[22rem] flex-col overflow-hidden rounded-md border",
            "border-granite-200 bg-canvas shadow-lg",
          )}
        >
          {filterable && groups.length > 1 && (
            <div
              role="group"
              aria-label="Narrow by type"
              className={cn(
                "flex shrink-0 gap-1.5 border-b border-hairline px-2 py-2",
                // Swipeable on a phone, wrapped where the panel is wide.
                "overflow-x-auto sm:flex-wrap sm:overflow-x-visible",
              )}
            >
              <FilterChip
                label={allLabel}
                pressed={scope === null}
                dimmed={false}
                onPress={() => narrow(null)}
              />
              {groups.map((group) => (
                <FilterChip
                  key={group.label}
                  label={group.shortLabel ?? group.label}
                  pressed={scope === group.label}
                  // A type the current search has already ruled out is shown
                  // greyed rather than hidden, so the row never reshuffles
                  // under a thumb that is reaching for it.
                  dimmed={!results.some((g) => g.label === group.label)}
                  onPress={() => narrow(group.label)}
                />
              ))}
            </div>
          )}

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Search results"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
          >
            {flat.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-small text-ink-muted">
                {emptyLabel}
              </p>
            ) : (
              <>
                {visible.map((group) => (
                  <div
                    key={group.label}
                    role="group"
                    aria-labelledby={`${id}-grp-${slug(group.label)}`}
                  >
                    {/* A heading inside a single-type list would only repeat
                        the chip the guest just pressed. */}
                    {!scope && (
                      <p
                        id={`${id}-grp-${slug(group.label)}`}
                        className="px-3.5 pt-2.5 pb-1 text-label uppercase text-ink-faint"
                      >
                        {group.label}
                      </p>
                    )}
                    {group.options.map((option) => (
                      <Row
                        key={option.id}
                        id={`${id}-opt-${option.id}`}
                        option={option}
                        active={flat[active]?.id === option.id}
                        picked={selected?.id === option.id}
                        onPick={() => commit(option)}
                        onHover={() =>
                          setActive(flat.findIndex((o) => o.id === option.id))
                        }
                      />
                    ))}
                  </div>
                ))}

                {visible.length === 0 && (
                  <p className="px-3.5 pt-3 pb-1 text-small text-ink-muted">
                    {emptyLabel}
                  </p>
                )}

                {flat.some((o) => o.id === FREE_TEXT_ID) && (
                  <div
                    className={cn(
                      "mt-1 pt-1",
                      visible.length > 0 && "border-t border-hairline",
                    )}
                  >
                    <Row
                      id={`${id}-opt-${FREE_TEXT_ID}`}
                      option={flat[flat.length - 1]}
                      active={flat[active]?.id === FREE_TEXT_ID}
                      picked={false}
                      onPick={() => commit(flat[flat.length - 1])}
                      onHover={() => setActive(flat.length - 1)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A type filter. Kept out of the tab order's way is the wrong instinct here:
 * it is a real button, reachable by Tab from the input, because a keyboard
 * user narrowing to "Rentals" is doing the same job as a thumb tapping it.
 */
function FilterChip({
  label,
  pressed,
  dimmed,
  onPress,
}: {
  label: string;
  pressed: boolean;
  dimmed: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-small font-semibold whitespace-nowrap",
        "transition-colors duration-[--duration-fast]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-600",
        pressed
          ? "bg-jade-700 text-white"
          : "bg-granite-100 text-ink-muted hover:bg-granite-200 hover:text-ink",
        dimmed && !pressed && "opacity-45",
      )}
    >
      {label}
    </button>
  );
}

function Row({
  id,
  option,
  active,
  picked,
  onPick,
  onHover,
}: {
  id: string;
  option: ComboboxOption;
  active: boolean;
  picked: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={picked}
      data-active={active}
      onPointerDown={(e) => {
        // Pick before the input loses focus, or the outside-click handler
        // closes the list out from under the click.
        e.preventDefault();
        onPick();
      }}
      onPointerMove={onHover}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 px-3.5 py-2",
        active && "bg-jade-50",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-small font-semibold text-ink">
            {option.label}
          </span>
          {option.tag && (
            <span className="shrink-0 rounded-sm bg-granite-100 px-1.5 py-0.5 text-caption font-semibold text-ink-muted">
              {option.tag}
            </span>
          )}
        </span>
        {option.meta && (
          <span className="mt-0.5 block truncate text-caption text-ink-muted">
            {option.meta}
          </span>
        )}
      </span>
      {picked && <Check className="size-4 shrink-0 text-jade-600" aria-hidden />}
    </div>
  );
}

/**
 * Ranked match: a name that starts with the query beats one that contains it,
 * which beats a keyword-only hit. Without the ranking, typing "16" surfaces
 * whatever happens to sort first rather than the 16 km stretch.
 */
function filterGroups(groups: ComboboxGroup[], query: string): ComboboxGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  const terms = q.split(/\s+/);

  return groups
    .map((group) => ({
      label: group.label,
      options: group.options
        .map((option) => ({ option, score: score(option, terms) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.option),
    }))
    .filter((g) => g.options.length > 0);
}

function score(option: ComboboxOption, terms: string[]): number {
  const label = option.label.toLowerCase();
  const haystack = `${label} ${option.meta ?? ""} ${option.keywords ?? ""}`.toLowerCase();

  let total = 0;
  for (const term of terms) {
    if (label.startsWith(term)) total += 4;
    else if (label.includes(term)) total += 3;
    else if (haystack.includes(term)) total += 1;
    // Every term has to land somewhere, or "bungee shimla" would match both.
    else return 0;
  }
  return total;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
