import type { Metadata } from "@/components/seo";
import { Styleguide } from "./styleguide";

const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

export function loader() {
  return { metadata };
}

export default function StyleguidePage() {
  return <Styleguide />;
}
