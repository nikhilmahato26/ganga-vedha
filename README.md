# Ganga Vedha

Rafting, bungee, stays, packages and rentals in Rishikesh: a mobile-first site where the sale
happens on WhatsApp, plus an admin panel the owner runs from a phone.

Runs on Cloudflare: the website on **Pages** (`frontend/`), the API on a **Worker** (`backend/`),
data in **D1**, photos on **Cloudinary**. How it is wired, and why, is in
[ARCHITECTURE.md](ARCHITECTURE.md); rules for working in the repo are in [AGENTS.md](AGENTS.md).

```bash
# API (backend/): runs on Cloudflare against the real database, reachable at http://localhost:8787
cd backend && pnpm install && pnpm dev

# Website (frontend/): http://localhost:5173
cd frontend && pnpm install && pnpm dev     # frontend/.env.local: VITE_API_URL=http://localhost:8787
```

Copy `backend/.env.example` → `backend/.env` and `backend/.dev.vars.example` → `backend/.dev.vars`
first (ARCHITECTURE.md §05). Deploys run from GitHub Actions on push to `main`.
