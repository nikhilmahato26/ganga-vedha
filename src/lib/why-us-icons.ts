import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  LifeBuoy,
  MapPin,
  Radio,
  Route,
  Shield,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * A curated, closed set — not free-text icon names. An admin picking from
 * twelve options can never typo a Lucide component name into a blank icon
 * slot on the live site.
 */
export const WHY_US_ICONS = {
  route: Route,
  radio: Radio,
  "life-buoy": LifeBuoy,
  sparkles: Sparkles,
  shield: Shield,
  clock: Clock,
  users: Users,
  star: Star,
  heart: Heart,
  "map-pin": MapPin,
  calendar: Calendar,
  "check-circle": CheckCircle2,
  award: Award,
} satisfies Record<string, LucideIcon>;

export type WhyUsIconKey = keyof typeof WHY_US_ICONS;

export function isWhyUsIconKey(v: string): v is WhyUsIconKey {
  return v in WHY_US_ICONS;
}
