import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge has to be told about our custom font-size scale.
 *
 * Without this it sees `text-small` or `text-title`, fails to recognise them as
 * sizes, classifies them as text *colours*, and silently drops the `text-white`
 * that came before them — which is how a primary button ends up with dark text
 * on an orange fill. Declaring the scale keeps size and colour in separate
 * conflict groups so both survive the merge.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-lg",
            "display-md",
            "title",
            "subtitle",
            "body",
            "small",
            "label",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
