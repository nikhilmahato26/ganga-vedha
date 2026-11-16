import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { router } from "./router";

// index.html carries a static title/description/Open Graph set for crawlers and link previews that
// don't run JavaScript. Once the app runs, components/seo.tsx renders the per-page set instead.
document.querySelectorAll("[data-static-head]").forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
