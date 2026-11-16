# Agent Instructions

> Build better, together.

Guidelines for AI coding agents working on this project.

---

## 01 Purpose

This file gives AI agents (Claude Code, Cursor, Copilot, …) the context and rules for working in
this repo. Ganga Vedha is a mobile-first site for a local service business where the sale happens on
**WhatsApp**, not a checkout, plus an admin panel the non-technical owner will run from a phone.
Follow these rules to keep the code consistent and the deploys green.

---

## 02 Before You Start

- [ ] Read [BLUEPRINT.md](BLUEPRINT.md): the stack, data model, anti-bug rules (§5) and phase plan. Those decisions are already made; don't re-argue them.
- [ ] Read [ARCHITECTURE.md](ARCHITECTURE.md): the **source of truth for how this project is wired** (addresses, the `/api` reverse proxy, login cookie, CORS/CSRF, secrets, local dev, deploys) and its incident log. **Before touching auth, cookies, CORS, `SITE_ORIGIN`, `VITE_API_URL`, env files, bindings or workflows, read its sections 02-05, and update it in the same commit.**
- [ ] Check which phase we're in (BLUEPRINT §10). The current state is recorded at the top of ARCHITECTURE.md.
- [ ] Look at the existing components in `frontend/src/components/` (`site/`, `admin/`, `ui/`) before writing new ones.
- [ ] Understand the folder layout: `frontend/` deploys to Pages, `backend/` deploys to a Worker. They never import each other's runtime code: the API imports a few shared files from `frontend/src/lib/` (ARCHITECTURE §06), the frontend imports only *types* from `backend/src/`.
- [ ] Run `git status` and read recent commits so you don't undo someone's work.

---

## 03 General Rules

- [ ] TypeScript everywhere. React 19 + Vite on the frontend; **Express on Cloudflare Workers** on the backend (not Hono, not Next.js).
- [ ] Follow the design system: tokens live in `frontend/src/globals.css` under `@theme` (DESIGN.md). No arbitrary `text-[…]` or `z-[…]` values.
- [ ] Reuse existing components and helpers (`lib/format.ts` for prices, phones and WhatsApp links, `lib/enquiry-schema.ts`, `lib/schemas/*`, `lib/closure.ts`, `components/ui/*`).
- [ ] One place per answer: phone normalisation, WhatsApp links, prices, API URL. Never compute the same thing in two files.
- [ ] Keep the static fallback working: with `VITE_API_URL` empty, the site must still browse on `src/lib/content.seed.ts` and enquiries must still open WhatsApp.
- [ ] **One address for the browser.** Production `VITE_API_URL` is `/`: the site calls `/api/*` on its own address and `frontend/functions/api/[[path]].ts` forwards to the Worker. Never point the browser at the `workers.dev` URL; cross-site login cookies are dropped (ARCHITECTURE §02).
- [ ] Anything the owner changes seasonally (prices, photos, closures, copy) belongs in the admin panel eventually, not hard-coded in a component.
- [ ] **Never invent evidence:** no fake ratings, review counts, customer numbers, certifications or prices. Use visible placeholders.
- [ ] Don't create files nobody asked for, and don't add dependencies without saying why.
- [ ] Don't change the deploy setup (`.github/workflows/`, Pages vs Worker, `wrangler` config) without asking first.

---

## 04 Code Guidelines

- [ ] Functional components and hooks only.
- [ ] Match the existing style of the folder you're in. `frontend/`: double quotes, semicolons, `@/` = `frontend/src` (kept from the Next.js app), except the files the API imports, which use relative imports only. New `backend/` files: single quotes, no semicolons, relative imports. A short `/** doc */` comment only where the *why* isn't obvious.
- [ ] Meaningful names; pages in `src/app/` (same paths as the old Next.js app, each registered in `src/router.tsx` with a `loader`), sections in `src/components/site/`, admin editors in `src/components/admin/`, primitives in `src/components/ui/`.
- [ ] Primitives in `components/ui/` have zero business knowledge. If one imports from `lib/content`, it's in the wrong folder.
- [ ] Forms validate with a Zod schema from `lib/schemas/`, and the API validates again with the same schema. Admin forms call the typed callers in `lib/actions/` (never `fetch` directly).
- [ ] Handle loading, empty and error states. A loading button keeps full opacity and shows a spinner.
- [ ] Mobile first: check every change at **390px** and **1440px**, no horizontal overflow, tap targets ≥ 44px.
- [ ] Accessible, semantic HTML: real `<button>`, `<a>`, `<dialog>`, `<details>`; colour is never the only signal; respect `prefers-reduced-motion`.
- [ ] Icons from `lucide-react` (brand marks from `simple-icons`). Never emoji as icons.
- [ ] Every route's `loader` returns `metadata` (title, description, canonical); `components/seo.tsx` renders it. Use `Link` from `@/components/link` and `Image` from `@/components/image`, not raw React Router links or `<img>` for Cloudinary photos.

**Backend, Express on Workers:**

- [ ] Bindings via `import { env } from 'cloudflare:workers'`, never `req.env`.
- [ ] No `express.json()` (crashes the Worker at startup), no `multer`, no `express-session`, no native addons like `bcrypt` or `sharp`. See BLUEPRINT §5 #23–27.
- [ ] D1 is SQLite: JSON as `text`, `CHECK` instead of enums, no arrays.
- [ ] Every schema change: edit `backend/src/schema.ts`, then `pnpm db:generate` writes a new file in `backend/migrations/`. Never edit an applied migration.
- [ ] Every admin route checks the session itself. A new admin function is an export in `backend/src/actions/` (first argument `admin`), which the RPC registry picks up, plus a typed caller in `frontend/src/lib/actions/`. The frontend route guard is UX only.
- [ ] **Nothing runs or is stored offline.** `pnpm dev` is `wrangler dev --remote`: the API runs on Cloudflare and uses the real D1/R2; `localhost:8787` only forwards to it. Never run `wrangler dev` without `--remote`, never use `--local` on D1 commands, and keep `"remote": true` on every binding in `backend/wrangler.jsonc`.

---

## 05 Security & Best Practices

- [ ] Never commit secrets. `.env`, `.dev.vars` and tokens stay out of git.
- [ ] Only `VITE_*` values reach the browser, and they are **public**. Never put a secret in a `VITE_` variable.
- [ ] Runtime secrets (JWT secret, Cloudinary key and secret, SMTP user and app password) go on the **API Worker** as type **Secret** (dashboard, or `npx wrangler secret put`), never on the Pages project, never as plain text, never in `wrangler.jsonc`. CI secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) stay in GitHub repo secrets. Full map: ARCHITECTURE §05.
- [ ] Validate all input twice: Zod in the browser, the same Zod schema in the Worker.
- [ ] Enquiry endpoint: honeypot field (silently accepted), per-IP rate limit, phone normalised to 10 digits.
- [ ] Auth: HttpOnly cookie (production `Secure; SameSite=None`, `http://localhost` `SameSite=Lax` without `Secure`), never localStorage, bcryptjs cost 12, the same error for "no account" and "wrong password", API refuses to run auth without a 32+ char `JWT_SECRET` (ARCHITECTURE §03).
- [ ] CORS allows exactly the origins in `SITE_ORIGIN`, never `*`. `originGuard` rejects writes from any other `Origin` (CSRF); a new site address must be added to `SITE_ORIGIN` or saves return 403 (ARCHITECTURE §04).
- [ ] Uploads go to Cloudinary only with a one-time ticket signed by the authenticated Worker. No unsigned upload preset, and the API secret never reaches the browser.
- [ ] Respect customer data: enquiries hold names and phone numbers. Don't log them, don't paste them into issues.
- [ ] Never run a destructive command (`git push --force`, deleting Cloudflare resources, `d1 execute` on `--remote`) without asking.

---

## 06 Useful Commands

```bash
# Frontend (run inside frontend/)
pnpm install              # install dependencies
pnpm dev                  # dev server at http://localhost:5173
pnpm typecheck            # tsc -b, must be zero errors
pnpm lint                 # oxlint, must be zero warnings
pnpm build                # production build into dist/
pnpm preview              # serve the built dist/ locally

# Backend (run inside backend/)
pnpm dev                                           # API runs on Cloudflare (--remote), reachable at :8787
pnpm typecheck                                     # tsc, must be zero errors
pnpm db:generate                                   # new migration from src/schema.ts
pnpm db:migrate                                    # apply migrations to the real D1
npx wrangler deploy --dry-run                      # check the bundle and bindings

# Deploys happen in CI on push to main. Don't run production deploys by hand.
```

Before saying a task is done, run `pnpm typecheck`, `pnpm lint` and `pnpm build` in `frontend/`
and `pnpm typecheck` in `backend/`, and confirm they pass.

---

## 07 Need Help?

If you're unsure about something:

- Check [BLUEPRINT.md](BLUEPRINT.md) and [ARCHITECTURE.md](ARCHITECTURE.md) first.
- Look at existing code for the pattern already in use, and copy it.
- If a rule here conflicts with the blueprint, the blueprint wins, **except for this project's wiring** (addresses, proxy, cookies, CORS, secrets, local dev, deploys), where ARCHITECTURE.md wins. Point out the conflict and fix the losing doc.
- Ask before big changes: new dependencies, new folders, stack or deploy changes, anything touching customer data.

Let's build something the owner can run without calling us.
