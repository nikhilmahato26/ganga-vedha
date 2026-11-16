import type { AnchorHTMLAttributes, Ref } from "react";
import { Link as RouterLink } from "react-router-dom";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
  replace?: boolean;
  /** Accepted for compatibility with the original next/link call sites; ignored. */
  prefetch?: boolean;
  scroll?: boolean;
};

/**
 * In-app links take `href`, as they did under Next.js, and navigate client-side through React
 * Router. External, mail, phone and same-page hash links stay plain anchors.
 */
export default function Link({ href, replace, prefetch: _prefetch, scroll: _scroll, ...rest }: Props) {
  if (/^(https?:|mailto:|tel:|sms:|whatsapp:|#)/.test(href) || rest.target === "_blank" || rest.download) {
    return <a href={href} {...rest} />;
  }
  return <RouterLink to={href} replace={replace} {...rest} />;
}
