# Getting Started with Cloudflare

> How the project is *wired* (addresses, proxy, cookies, secrets) is decided in
> [ARCHITECTURE.md](ARCHITECTURE.md). This guide is the clicks; if the two ever disagree,
> ARCHITECTURE.md wins and this file gets fixed.

A step-by-step guide for developers **new to Cloudflare** joining a client project built on this stack.
By the end you'll have dashboard access, a working local setup, and CI able to deploy.

For *how the system fits together* read [ARCHITECTURE.md](ARCHITECTURE.md). For *coding rules*
read [AGENTS.md](AGENTS.md). This file is only about getting set up.

**Placeholders used below:** `<project>` = the project's short slug (e.g. `acme-travel`), so the
Pages project is `<project>-web`, the database `<project>-db`, the bucket `<project>-media`.
`<client-domain>` = the client's real domain. Use the same names in the workflow files and
`wrangler.jsonc`.

---

## 0. The 60-second mental model

| Term | What it means here |
|---|---|
| **Cloudflare account** | Owned by the client. Their billing, their domain. You are invited in as a member. |
| **Pages** | Hosts our static frontend (`frontend/dist`). URL ends in **`.pages.dev`**. |
| **Worker** | Runs server code (our future Express API). URL ends in **`.workers.dev`**. |
| **D1** | Cloudflare's SQLite database. Our data will live here. |
| **R2** | Cloudflare's file storage. Our images will live here. |
| **Wrangler** | Cloudflare's CLI (`npx wrangler …`). Already a dev dependency in `frontend/`. |
| **API token** | A password-like key that lets GitHub Actions deploy without your login. |
| **Account ID** | Tells Wrangler *which* Cloudflare account to deploy into. Not secret, but kept alongside the token. |

**Pages and Workers look almost the same in the dashboard, and mixing them up breaks deploys.**
Our frontend is a **Pages** project. If you ever see its URL ending in `workers.dev`, something was
created as the wrong type.

---

## 1. Get access to the account

1. Ask the project lead to invite you. They (or the client) go to **Manage Account → Members →
   Invite member**, enter your email and pick a role (Administrator for full setup work).
2. Accept the invite from your email. Create a Cloudflare login if you don't have one.
3. Log in at [dash.cloudflare.com](https://dash.cloudflare.com). If you belong to several accounts,
   use the **account switcher at the top left** to pick the client's account.

---

## 2. Find your way around the dashboard

The left sidebar is what you'll use. The parts that matter for this project:

| Sidebar item | What you'll find there |
|---|---|
| **Account home** | Overview of the account and its domains. |
| **Compute → Workers & Pages** | The Pages project `<project>-web` (and later the API Worker). Deployments, logs, custom domains, settings. |
| **Storage & databases → D1** | The database (once the backend exists). You can run SQL in the console here. |
| **Storage & databases → R2** | The image bucket (once the backend exists). |
| **Domains** | The client's domain and its DNS records. |
| **Your profile icon (top right) → Profile → API Tokens** | Where CI tokens are created. |
| **Manage Account → Members** | Who has access. |

**Inside a Pages project** (Workers & Pages → `<project>-web`):

- **Deployments:** every deploy, with its URL. Production = `main`; any other branch gets a preview URL.
- **Custom domains:** attach the client's real domain here (at launch).
- **Settings:** build and runtime settings. We don't build here: CI builds and uploads.

---

## 3. Find the Account ID

Either:

- **Workers & Pages** overview: the **Account ID** is shown in the right-hand panel, with a copy button, or
- **Account home**: open the account menu (⋯ next to the account name) → **Copy account ID**.

Keep it handy for step 5.

---

## 4. Create the CI API token

GitHub Actions must not use anyone's personal login, so it gets its own token.

1. Top right **profile icon → Profile → API Tokens → Create Token**.
2. Scroll to **Custom token → Get started**.
3. **Token name:** `<project>-github-ci`.
4. **Permissions:** add these rows:

   | Scope | Resource | Access | Needed for |
   |---|---|---|---|
   | Account | Cloudflare Pages | Edit | Frontend deploys (**needed now**) |
   | Account | Workers Scripts | Edit | Backend deploys (add when `backend/` exists) |
   | Account | D1 | Edit | Backend migrations (add when `backend/` exists) |
   | Account | Workers R2 Storage | Edit | Image bucket (add when `backend/` exists) |

   You can add all four now to avoid coming back later, or only the first one for now.
5. **Account Resources:** *Include → the client's account* (not "All accounts").
6. **Continue to summary → Create Token.**
7. **Copy the token now. Cloudflare shows it only once.** Lost it? Roll it (API Tokens → ⋯ → Roll)
   and update GitHub.

> If a deploy fails with **"No access to the specified resource"**, the token is missing a
> permission row from the table above. Edit the token and add it; you don't need a new token.

---

## 5. Add the secrets to GitHub

In the GitHub repo: **Settings → Secrets and variables → Actions**.

**Secrets tab → New repository secret:**

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from step 4 |
| `CLOUDFLARE_ACCOUNT_ID` | the ID from step 3 |

**Variables tab → New repository variable** (only once the backend exists):

| Name | Value |
|---|---|
| `VITE_API_URL` | `/` (the site reaches the API through its own `/api` reverse proxy; see ARCHITECTURE.md §02). Never the `workers.dev` URL. |

The names must match exactly. `.github/workflows/deploy-frontend.yml` reads these.
`VITE_API_URL` is a *variable*, not a secret, because it ends up in the public JavaScript anyway.
It is baked in at build time: after changing it, re-run **Actions → Deploy Frontend**.

---

## 6. Create the Pages project (one time only)

CI can update a Pages project but **cannot create one**. Skip this if `<project>-web` already
shows under Workers & Pages **with a `pages.dev` URL**.

1. **Workers & Pages → Create application.**
2. The screen opens on **Workers** by default. Switch to the **Pages** tab (or click *"Looking to
   deploy Pages? Get started"*).
3. Choose **Upload assets** / **Drag and drop your files**. **Not** "Connect to Git": CI uploads for
   us, and a Git-connected project can't be switched to uploads later.
4. **Project name:** `<project>-web`, exactly. It must match `--project-name` in the workflow.
5. Create it, then upload a first build: run `pnpm build` in `frontend/` and drop in the
   `frontend/dist` folder.
6. Check the project URL ends in **`<project>-web.pages.dev`**.

CLI alternative (with `backend/.env` filled in, see step 7):

```bash
cd frontend
npx wrangler pages project create <project>-web --production-branch=main
```

---

## 7. Set up your machine

**Install once:**

- **Node 22** (e.g. via `nvm install 22`)
- **pnpm 10**: `npm install -g pnpm@10` (or `corepack enable`)
- **Git**, and access to the GitHub repo

**Clone and run the frontend:**

```bash
git clone <repo-url> <project>
cd <project>/frontend
pnpm install
cp .env.example .env        # leave VITE_API_URL empty for now
pnpm dev                    # http://localhost:5173
```

With `VITE_API_URL` empty the site runs on the seed data in `src/data/` and enquiries go straight
to WhatsApp. That's expected; there's no backend yet.

**Wrangler credentials** (for backend commands): put `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` in `backend/.env` (see §10.1–10.2). Wrangler reads them from there, so no
`wrangler login` is needed. Check with `npx wrangler whoami` inside `backend/`.

---

## 8. Environment variables: where each one lives

| Variable | Local (your machine) | Production | Who reads it | Secret? |
|---|---|---|---|---|
| `VITE_API_URL` | `frontend/.env.local` | GitHub **variable** | Browser code (baked in at build) | **No**, public |
| `CLOUDFLARE_API_TOKEN` | `backend/.env` | GitHub **secret** | Wrangler / CI | **Yes** |
| `CLOUDFLARE_ACCOUNT_ID` | `backend/.env` | GitHub **secret** | Wrangler / CI | Treat as private |
| `JWT_SECRET` | `backend/.dev.vars` | Worker **secret** (dashboard, §10.8) | The Worker at runtime | **Yes** |
| `SITE_ORIGIN` | `backend/.dev.vars` | `backend/wrangler.jsonc` → `vars` | The Worker (CORS + CSRF guard) | No |
| D1 database id | `backend/wrangler.jsonc` | same file | Wrangler | No |
| R2 bucket name | `backend/wrangler.jsonc` | same file | Wrangler | No |

Rules:

- `.env`, `.env.local` and `.dev.vars` are **never** committed (all gitignored). The `*.example` files are, with empty values.
- Anything starting with `VITE_` is visible to every visitor. Never put a secret there.
- Never paste a token into chat, an issue or a commit. If one leaks: API Tokens → ⋯ → **Roll**, then update it everywhere in the table above.

---

## 9. Deploying

You normally **don't deploy by hand**. Push to `main` and GitHub Actions does it:

```
git push → Actions: pnpm install → pnpm build → wrangler pages deploy dist → live on Pages
```

- The workflow only runs when something in `frontend/**` (or the workflow file) changes.
- To re-run without a new commit: GitHub → **Actions → Deploy Frontend → Run workflow**.
- Watch progress in the **Actions** tab, then check **Workers & Pages → <project>-web →
  Deployments** for the live URL.
- Any branch other than `main` gets its own preview URL, which is handy for showing the client.

Manual deploy, only if CI is broken and you've been asked to:

```bash
cd frontend
pnpm run deploy             # pnpm build && wrangler pages deploy dist --project-name=<project>-web
```

---

## 10. The backend: everything by hand in the dashboard

The backend is an Express API on a Cloudflare **Worker**, storing data in **D1** (SQLite) and photos
in **R2**. Every resource below is created by clicking in the dashboard. After each step, the
**"Put it in the code"** box says exactly which file and line the value goes into.

Names are fixed; the code expects exactly these:

| Thing | Name |
|---|---|
| D1 database | `<project>-db` |
| R2 bucket | `<project>-media` |
| Worker (API) | `<project>-api` |

### 10.1 API token (lets your laptop and GitHub talk to Cloudflare)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → pick the account (top left).
2. **Manage Account → Account API Tokens** (or profile icon → **API Tokens**) → **Create Token** →
   **Custom token**.
3. **Name:** `<project>-deploy`. **Permissions**, all **Account**, each with Read + Write/Edit:
   **Cloudflare Pages**, **D1**, **Workers R2 Storage**, **Workers Scripts**.
4. **Account resources:** this account only. **Expiration:** your choice.
5. **Continue to summary → Create token.** Copy it now: it is shown once.

> **Put it in the code**
> - `backend/.env` → `CLOUDFLARE_API_TOKEN=<token>`
> - GitHub → repo → Settings → Secrets and variables → Actions → **Secrets** → `CLOUDFLARE_API_TOKEN`

### 10.2 Account ID

**Workers & Pages** overview → right-hand panel → **Account ID** → copy.

> **Put it in the code**
> - `backend/.env` → `CLOUDFLARE_ACCOUNT_ID=<id>`
> - GitHub → **Secrets** → `CLOUDFLARE_ACCOUNT_ID`

### 10.3 D1 database

1. **Storage & databases → D1 SQL database → Create**.
2. **Name:** `<project>-db`. **Location:** Asia-Pacific (our visitors are in India).
3. **Create**. On the database page, copy the **Database ID** (a long `xxxxxxxx-xxxx-…` value).

> **Put it in the code:** `backend/wrangler.jsonc`
> ```jsonc
> "d1_databases": [
>   {
>     "binding": "DB",                                   // don't change: the code uses env.DB
>     "database_name": "<project>-db",           // must match the dashboard name
>     "database_id": "<paste the Database ID here>",
>     "migrations_dir": "migrations",
>     "remote": true                                     // local dev uses this real database
>   }
> ]
> ```

### 10.4 Create the tables (by hand, in the D1 console)

1. Open the database → **Console** tab.
2. Open `backend/migrations/0001_init.sql` in your editor, copy **all** of it, paste into the console,
   **Execute**.
3. Then run this, so later migrations know `0001` is already done (this is exactly what
   `wrangler d1 migrations apply` records; skip it and the next migration run fails):
   ```sql
   CREATE TABLE IF NOT EXISTS d1_migrations (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT UNIQUE,
     applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
   );
   INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0001_init.sql');
   ```
4. **Tables** tab should now list `admin_users`, `audit_log`, `d1_migrations`, `media`,
   `media_links`, `packages`.

Every later file in `backend/migrations/` (`0002_…sql`, …) goes the same way: paste it, run it,
then `INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0002_….sql');`. Never edit a file that
has already been run. (`pnpm db:migrate` in `backend/` does both steps in one go on the cloud database, if you prefer.)

### 10.5 R2 photo bucket

1. **R2 Object Storage**. First time only: **Activate / Purchase R2** and add a payment method.
   The free tier (10 GB, 1M uploads/month) costs nothing; Cloudflare just requires it on file.
2. **Create bucket** → **Name:** `<project>-media` → **Location:** Automatic (hint:
   Asia-Pacific) → **Storage class:** Standard → **Create bucket**.
3. **Leave public access off.** No public development URL, no custom domain. Photos are uploaded and
   served only through the API, which checks the admin login first.

> **Put it in the code:** `backend/wrangler.jsonc`
> ```jsonc
> "r2_buckets": [
>   {
>     "binding": "MEDIA",                          // don't change: the code uses env.MEDIA
>     "bucket_name": "<project>-media",    // must match the dashboard name
>     "remote": true                               // local dev uses this real bucket
>   }
> ]
> ```
> R2 has no ID to copy: the name is enough. Until this block exists, photo uploads answer
> "Photo storage isn't connected yet" (there is deliberately no local stand-in).

### 10.6 Local secrets (your machine only)

Copy `backend/.dev.vars.example` to `backend/.dev.vars` and fill in:

> **Put it in the code:** `backend/.dev.vars`
> ```
> JWT_SECRET=<any long random string, e.g. 64 letters and numbers mashed on the keyboard>
> SITE_ORIGIN=http://localhost:5173,http://localhost:5174
> ```
> `SITE_ORIGIN` lists the exact address(es) the frontend runs on. If the admin says "Could not reach
> the server" or the login doesn't stick, this is the first thing to check.

And in the frontend:

> **Put it in the code:** `frontend/.env.local`
> ```
> VITE_API_URL=http://localhost:8787
> ```

Run it: `pnpm dev` in `backend/`, `pnpm dev` in `frontend/`, open `/admin`. `pnpm dev` runs
`wrangler dev --remote`: the API itself runs on Cloudflare against the real D1 and R2, and
`http://localhost:8787` just forwards to it. **Nothing runs or is stored offline, and changes made while
developing edit the real data.** Each save re-uploads the code (a few seconds); requests take a few
hundred milliseconds. `backend/.wrangler/tmp/` only holds the code bundle being uploaded and Wrangler's empty scratch
files (no data); it is gitignored and safe to delete.

### 10.7 First admin account (in the browser)

Open `/admin`. While the database has no admin, it shows **Create your admin account**: name, email,
password (10+ characters). Submit once; from then on it is a normal login page and the setup screen is
gone for good. Do this **before** the API is public, or whoever opens it first gets the account.

To check or reset later: D1 → **Console** → `SELECT id, email, last_login_at FROM admin_users;`
(deleting the row there brings the setup screen back).

### 10.8 Production (the live site)

1. **Deploys are automatic (GitHub Actions + the token).** `.github/workflows/deploy-backend.yml`
   runs on every push to `main` that touches `backend/` (or the frontend files the API shares). It
   installs, typechecks, applies new D1 migrations, then runs `wrangler deploy`. It uses the same
   `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` GitHub secrets as the frontend, so that token needs
   the D1, R2 and Workers Scripts permissions (§10.1). Run it by hand from **Actions → Deploy Backend →
   Run workflow**. The first run creates the Worker `<project>-api` at
   `https://<project>-api.<account-subdomain>.workers.dev`.
   **Create the admin account first** (§10.7): until one exists, the setup screen is open to anyone.
2. **Worker secret:** **Workers & Pages → <project>-api → Settings → Variables and Secrets →
   Add** → Type **Secret** → Name `JWT_SECRET` → a *new* long random value (not the local one) →
   **Deploy**.
3. **Allowed site address:** same screen → Type **Text** → `SITE_ORIGIN` =
   `https://<project>-web.pages.dev` (later, the client domain). Or edit `vars.SITE_ORIGIN` in
   `backend/wrangler.jsonc`; the file wins on the next deploy, so keep the two the same.
4. **Point the site at the API:** GitHub → Settings → Secrets and variables → Actions → **Variables**
   → `VITE_API_URL` = `/` → re-run **Deploy Frontend**.
   `/` means "the API is on this same site": `frontend/functions/api/[[path]].ts` is a reverse proxy
   (a Cloudflare Pages Function, deployed with the site) that forwards every `/api/*` request to the
   Worker. The browser only ever sees the site's own address, so the admin login cookie works in every
   browser, iPhones included, and keeps working unchanged on a custom domain later.
5. **Login cookie and forgery protection:** the cookie is `HttpOnly; Secure; SameSite=None` in
   production (like a split vercel.app/onrender.com setup), `SameSite=Lax` on http://localhost. Because
   `None` lets other sites trigger requests, the API refuses any write whose `Origin` is not in
   `SITE_ORIGIN` (`originGuard` in `backend/src/lib/http.ts`).
6. **Custom domain (later):** add it to the Pages project (**Custom domains**). With `VITE_API_URL=/`
   nothing else changes except adding the domain to `SITE_ORIGIN` in `backend/wrangler.jsonc`.

Once `VITE_API_URL` is set, **packages come from the admin panel, not `src/data/`**. Add them in
`/admin` first, or the website's packages section will be empty.

### 10.9 Checklist

- [ ] Token has Pages, D1, R2 and Workers Scripts permissions; saved in `backend/.env` and GitHub
- [ ] Account ID in `backend/.env` and GitHub
- [ ] D1 `<project>-db` exists; its ID is in `backend/wrangler.jsonc`
- [ ] D1 **Tables** tab shows the six tables including `d1_migrations`
- [ ] R2 is activated and bucket `<project>-media` exists, public access off
- [ ] `backend/.dev.vars` and `frontend/.env.local` filled in
- [ ] `/admin` shows the setup screen once, then a login page

---

## 11. Troubleshooting: errors we've actually hit

| Error | Cause | Fix |
|---|---|---|
| `The Pages project "<project>-web" does not exist` | The project was created as a **Worker**, or not created yet. | Step 6. Check the URL ends in `pages.dev`. |
| `No access to the specified resource` | API token missing a permission (e.g. Workers Scripts for a Worker deploy). | Step 4: edit the token, add the row. |
| `Authentication error [code: 10000]` | Wrong or expired token, or `CLOUDFLARE_ACCOUNT_ID` doesn't match the token's account. | Re-copy both into GitHub secrets (step 5). |
| Deep link like `/tours/xyz` shows 404 after refresh | A `404.html` ended up in `dist/`, which disables Pages' SPA fallback. | Remove it; Pages then serves `index.html` for unknown routes. |
| Workflow didn't run after a push | Nothing under `frontend/**` changed. | Use **Run workflow** in the Actions tab. |
| `wrangler` asks which account to use | Your login has access to several accounts. | Pick the client's account, or export `CLOUDFLARE_ACCOUNT_ID`. |
| `The given account is not valid or is not authorized to access this service [code: 7403]` on `d1 migrations apply` | The GitHub secrets point at a different account than the one that owns the D1 database (common when the Pages project was set up earlier from another account), or the token was created in another account, or it lacks **D1: Edit**. | Switch to the account that shows `<project>-db` under D1, copy **its** Account ID (§10.2) into `CLOUDFLARE_ACCOUNT_ID`, make the token **in that account** with D1, Workers Scripts, R2 and Pages edit (§10.1), update both GitHub secrets, then **Re-run all jobs**. Pages, Worker, D1 and R2 must all be in the same account. |
| Admin login returns error 1102 or "Worker exceeded CPU time limit" | The API Worker is on Workers **Free** (10 ms CPU); bcrypt at cost 12 needs more. | Workers & Pages → Plans → **Workers Paid** (US$5/month). BLUEPRINT §5 #40. |

---

## Checklist: you're ready when…

- [ ] You can log in and see `<project>-web` under Workers & Pages with a `pages.dev` URL
- [ ] `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist in GitHub repo secrets
- [ ] `pnpm dev` runs the site locally
- [ ] `npx wrangler whoami` shows the right account
- [ ] The latest **Deploy Frontend** run in GitHub Actions is green
- [ ] `pnpm dev` in `backend/` answers `{"ok":true}` at `http://localhost:8787/api/health`
- [ ] Everything in §10.9 is ticked
