/**
 * The closed set of icon names a "Why us" item may use. Kept apart from the icon components
 * (why-us-icons.ts) so the API Worker can validate against it without bundling lucide-react.
 */
export const WHY_US_ICON_KEYS = [
  "route",
  "radio",
  "life-buoy",
  "sparkles",
  "shield",
  "clock",
  "users",
  "star",
  "heart",
  "map-pin",
  "calendar",
  "check-circle",
  "award",
] as const;

export type WhyUsIconKey = (typeof WHY_US_ICON_KEYS)[number];
