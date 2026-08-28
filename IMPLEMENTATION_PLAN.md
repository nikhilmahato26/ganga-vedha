# Ganga Vedha — Implementation Plan

Next.js (App Router) · TypeScript · Tailwind · Neon Postgres · Cloudinary
Booking model: **enquiry capture → WhatsApp hand-off.** No payment gateway.

---

## 0. The decisions that prevent logical errors

You asked for no logical errors. Almost every bug in a site like this comes from one of these
eleven decisions being made late or made implicitly. They are made here, up front.

| # | Trap | Decision |
|---|---|---|
| 1 | Closing rafting for monsoon also kills hotel enquiries | Closure is **scoped**, not global. Resolution order: `global > service line > individual product`. Rafting shuts; hotels stay open. |
| 2 | Owner raises a price; old enquiries now show the new price | Enquiry rows store `product_name_snapshot` + `product_price_snapshot_inr` at submit time. The quote is frozen. |
| 3 | Owner deletes a hotel that has 40 enquiries against it → FK explosion | `product_id` is `ON DELETE SET NULL`. The snapshot columns keep the enquiry readable forever. Products are **soft-deleted** (`is_published=false`) by default; hard delete is a separate, confirmed action. |
| 4 | Two hotels named "Ganga View" → same slug → one overwrites the other | `slug` is `UNIQUE`. Auto-generated from name, collision-suffixed (`ganga-view-2`), and editable. Changing a live slug warns about breaking links. |
| 5 | Unsigned Cloudinary upload preset gets scraped and abused | Uploads are **signed server-side**. The API route authenticates the admin, then returns a one-shot signature. No upload preset is ever public. |
| 6 | Deleted hotel leaves 30 orphan images burning Cloudinary quota | `media` is a first-class table. Deleting an entity unlinks; a "Unused media" screen in admin lists orphans and deletes them from Cloudinary + DB together. Never one without the other. |
| 7 | Neon + serverless = connection exhaustion under any real traffic | Use the **pooled** Neon connection string (`-pooler` host) with `@neondatabase/serverless`. No long-lived `pg.Pool` in route handlers. |
| 8 | Landing page hits the DB on every request, or caches forever and ignores admin edits | ISR + `revalidateTag`. Every admin mutation calls `revalidateTag('landing')` / `revalidateTag('hotel:'+slug)`. Fast pages, instant edits. |
| 9 | Gallery images reorder themselves randomly between deploys | Every ordered collection has an explicit `sort_order INT`. Nothing relies on insert order or `id`. |
| 10 | Booking dates land on the wrong day for Indian users | All timestamps `timestamptz`; `travel_date` is a bare `DATE`. Rendering and "today" comparisons pin to `Asia/Kolkata`. |
| 11 | Owner dismisses the closure modal, then edits the message — nobody sees the update | Closure rows carry a `version INT`. Dismissal is stored in `sessionStorage` keyed by `closureId:version`. Bumping the message bumps the version and the modal returns. |

Two more, at the edges: the enquiry form gets a honeypot field + a per-IP rate limit (an unprotected
form on an Indian travel site fills with spam within a week), and phone input normalises `+91`,
`0`-prefixed, and spaced formats to a single 10-digit stored value so the WhatsApp deep-link never breaks.

---

## 1. Data model

Eleven tables. The shape matters more than the code — get this right and the rest is mechanical.

**`admin_users`** — id, email UNIQUE, password_hash (bcrypt, cost 12), name, last_login_at, timestamps.
Single row to start.

**`site_settings`** — singleton. brand_name, tagline, whatsapp_number, phone, email, address,
map_url, socials JSONB, hero_heading, hero_subheading, hero_media_id, hero_media_kind (`image`|`video`),
announcement_bar (text, nullable), timestamps. This is what makes the site editable without a deploy.

**`service_lines`** — exactly three seeded rows keyed `hotel` | `rafting` | `bungee`.
label, headline, blurb, card_media_id, sort_order, is_active. These are the three cards.

**`adventures`** — one table, `kind` discriminator (`rafting` | `bungee`). One admin form serves both;
fewer code paths, fewer bugs.
`slug UNIQUE`, name, **`distance_km NUMERIC`** (rafting only), height_m (bungee only), put_in_point,
grade (`easy`|`moderate`|`challenging`), duration_minutes, price_inr, compare_at_price_inr,
rating, review_count, badge (`Most Popular` etc.), summary, description, inclusions JSONB,
exclusions JSONB, meeting_point, min_age, min_weight_kg, max_weight_kg, cover_media_id,
sort_order, is_published, seo_title, seo_description, timestamps.

> The km option you asked for lives here as a real column — rafting is browsable, filterable and
> sortable by distance, and the nav renders "12 KM from Brahmpuri / 16 KM from Shivpuri / 24 KM from
> Marine Drive / 26 KM / 32 KM from Kaudiyala" straight from the table.

**`hotels`** — slug UNIQUE, name, tagline, description, address, locality, lat, lng, map_url,
star_rating, price_per_night_inr, compare_at_price_inr, check_in_time, check_out_time,
amenities JSONB (keys → icon map), house_rules JSONB, cover_media_id, rating, review_count,
is_published, sort_order, seo_*, timestamps.

**`hotel_rooms`** — hotel_id FK CASCADE, name, occupancy, bed_type, price_per_night_inr,
inclusions JSONB, media_id, sort_order.

**`media`** — cloudinary_public_id UNIQUE, secure_url, width, height, format, bytes, blurhash,
alt_text, folder, timestamps. Every image reference in the system is a `media_id`, never a raw URL.

**`media_links`** — the polymorphic gallery table. media_id, entity_type
(`hotel`|`adventure`|`gallery`|`service_line`), entity_id, sort_order,
`UNIQUE(entity_type, entity_id, media_id)`. One table gives every entity an ordered gallery.

**`closures`** — scope (`global`|`service`|`entity`), service_key, entity_type, entity_id,
is_active, icon (`rain`|`wrench`|`calendar`), title, body, footnote, cta_label,
starts_at, ends_at, **version**, timestamps. This is screenshot 4, made controllable.

**`enquiries`** — ref_code (short human code, `GV-7Q4KD2`), product_kind, product_id (SET NULL),
product_name_snapshot, product_price_snapshot_inr, name, phone, email, travel_date,
group_size, message, source (`hero`|`card`|`detail`|`floating`), status
(`new`|`contacted`|`confirmed`|`completed`|`lost`), admin_note, utm JSONB, ip_hash,
user_agent, contacted_at, timestamps.

**`reviews`** — author_name, rating, body, source, avatar_media_id, is_published, sort_order.
**`content_blocks`** — key UNIQUE, title, subtitle, body, items JSONB, is_active, sort_order.
Powers "Why Choose Us", "Comfort Highlights", "Our Promise" without new tables per section.
**`audit_log`** — admin_user_id, action, entity_type, entity_id, diff JSONB, created_at.

---

## 2. Phases

Each phase ends in something you can open in a browser. Nothing is "done later".

### Phase 0 — Foundation *(no credentials needed)*
Scaffold Next.js 15 + TS + Tailwind v4. Folder structure (`(site)` and `(admin)` route groups).
Design tokens: palette, type scale, spacing, radii, shadows — Ganga Vedha's own identity, not
DroneCraft's. Base primitives: Button, Field, Badge, Card, Modal, Toast, Table.
Drizzle ORM + schema file + first migration. `.env.example`. Zod env validation that fails loud
at boot instead of `undefined` at runtime.
**Deliverable:** styleguide route showing every token and primitive.

### Phase 1 — Data layer + auth *(needs Neon URL)*
Point Drizzle at Neon, run migrations, write the seed (3 service lines, 5 rafting stretches,
1 bungee, site settings, content blocks). Admin auth: bcrypt + signed httpOnly JWT cookie (`jose`),
middleware guarding `/admin/*`, login page, logout, change-password. Admin shell: sidebar,
mobile drawer, breadcrumbs, toast system.
**Deliverable:** you can log in and see an empty dashboard.

### Phase 2 — Admin CRUD + media *(needs Cloudinary keys)*
Signed upload endpoint. Uploader component: drag-drop, multi-file, client-side resize before
upload, progress, alt-text prompt, reorder by drag. Then full CRUD for adventures, hotels
(+ rooms), reviews, content blocks, site settings. Every list is searchable, filterable,
reorderable. Every form is Zod-validated on both client and server — the same schema object,
so they cannot drift.
**Deliverable:** the client can add a hotel with photos and it exists in the database.

### Phase 3 — Landing page
Announcement bar → sticky header with rafting-by-km dropdown → hero → **the three cards**
(hotel booking / river rafting / bungee jumping, built to the anatomy in screenshot 2: media with
grade chip, duration chip, rating chip, "Best for…" ribbon, title, blurb, distance+duration stat
row, price, Book Now) → why-us → comfort highlights → gallery → reviews → footer.
All content from the DB. ISR with tag revalidation. Mobile-first.
**Deliverable:** the public landing page, fully editable from admin.

### Phase 4 — Detail pages
`/rafting/[slug]` — gallery, distance/duration/grade stats, description, inclusions/exclusions,
meeting point, what to bring, FAQ, sticky mobile booking bar, related stretches.
`/bungee/[slug]` — same shell, height instead of distance.
`/hotels` + `/hotels/[slug]` — **the hotel details page**: gallery with lightbox, amenity grid,
room-type cards with per-room pricing, location + map, house rules, check-in/out, policies,
nearby adventures, sticky enquiry bar.
Full `generateMetadata`, OG images, JSON-LD (`Hotel`, `TouristAttraction`, `Product`).
**Deliverable:** every product has a real page that ranks.

### Phase 5 — Enquiry flow + booking-closed system
Enquiry modal (name, phone, date, group size, message) — accessible, focus-trapped, keyboard-closable,
optimistic, with a success state showing the ref code and a prefilled WhatsApp button.
Server action: Zod validate → honeypot → rate limit → snapshot price → insert → return ref code.
Floating WhatsApp button.
Closure system: `resolveClosure(entity)` helper, the full-screen interstitial from screenshot 4,
version-keyed dismissal, and **every** Book Now button reading closure state so a closed product
physically cannot take an enquiry.
**Deliverable:** end-to-end booking enquiry, and a monsoon switch the owner can flip.

### Phase 6 — Admin power features
Dashboard (today / 7-day / 30-day enquiry counts, status funnel, top stretch, recent activity).
Bookings inbox with the status pipeline, one-tap WhatsApp reply, notes, CSV export.
Closure manager with live preview. Audit log. Unused-media cleanup.
**Deliverable:** the panel becomes a business tool, not a content form.

### Phase 7 — Harden and launch
Error boundaries, `not-found`, loading skeletons, empty states with real guidance.
Image `sizes` audit, font subsetting, Lighthouse pass (target ≥95 mobile).
Keyboard + screen-reader pass, focus-visible everywhere, contrast audit.
`sitemap.xml`, `robots.txt`, canonicals, analytics.
Seed → wipe → reseed rehearsal so the client's first real data entry is not the first test.
A one-page handover doc written for a non-technical owner.

---

## 3. Making the admin panel genuinely good for the client

The brief asked for suggestions. These are ranked by what a non-technical Rishikesh operator will
actually feel, not by what is fun to build.

**Ship in Phase 6 — high value, low cost**

1. **Bookings inbox with a status pipeline.** New → Contacted → Confirmed → Completed → Lost.
   Without this the owner tracks leads in their head and loses them. This single feature is the
   difference between a website and a business tool.
2. **One-tap WhatsApp reply.** Each enquiry row has a button that opens WhatsApp with the customer's
   number and a prefilled message: name, product, date, group size, ref code. The owner's actual
   job, reduced to one tap.
3. **The monsoon switch on the dashboard.** Not buried in settings — a labelled control on the
   home screen: *"Rafting bookings: OPEN / CLOSED"*, with the message they will show and a
   **Preview** button that renders the real interstitial. They will use this twice a year under
   pressure; it must be findable in three seconds.
4. **A dashboard that answers "how are we doing".** Enquiries today, this week, this month;
   which stretch is selling; conversion from new → confirmed. One screen, no configuration.
5. **New-enquiry notification.** Email (Resend) or a WhatsApp Cloud API ping the moment an enquiry
   lands. A lead that sits unread for six hours is a lead lost to the operator who replied first.
6. **Live preview / "View as visitor".** Every edit form has a link to the public page it affects.
   Non-technical clients do not trust an edit they cannot see.

**Ship in Phase 2 — they cost almost nothing while you are already in the code**

7. **Drag-to-reorder everywhere.** Cards, gallery, stretches, reviews, rooms. The alternative is
   a "sort order" number field, which every client gets wrong.
8. **Duplicate.** "Duplicate this hotel" / "Duplicate this stretch" — adding the fifth similar
   listing should take 90 seconds, not fifteen minutes.
9. **Bulk image upload with auto-optimisation.** Drop 20 phone photos; client-side resize to
   max 2000px before upload. The owner's 8MB camera JPEGs must never reach the visitor.
10. **A single price editor.** One table, every price on the site, edit inline, save once.
    Seasonal repricing is a five-minute job instead of twelve separate forms.

**Worth it, slightly more work**

11. **Blackout dates per product.** Beyond the seasonal closure — block specific dates
    (full raft fleet booked, staff wedding). The enquiry date picker greys them out.
12. **Undo / version history on content edits.** The `audit_log` already stores the diff;
    surfacing a "restore" button costs one screen and saves one panicked phone call.
13. **SEO fields per page** with a live Google-result preview. Travel is a search business.
14. **CSV export of enquiries.** Owners want their data in Excel. Always.
15. **A mobile-first admin.** The owner will edit prices from a phone at the riverbank. Sidebar
    collapses to a drawer, tables become cards, forms are single-column, tap targets ≥44px.

**Deliberately out of scope** — payment gateway, multi-user roles, real-time seat inventory,
multilingual. Each is a phase of its own. The schema does not block any of them: `enquiries`
already has room for `payment_status` and `amount_paid`, and `admin_users` for a `role` column.

---

## 4. What I need from you

| Blocks | Item |
|---|---|
| Phase 1 | Neon pooled connection string (`postgresql://…-pooler.…neon.tech/…?sslmode=require`) |
| Phase 2 | Cloudinary `cloud_name`, `api_key`, `api_secret` |
| Phase 3 | WhatsApp business number, phone, email, address |
| Phase 3 | Logo (SVG preferred) — placeholder wordmark until then |
| Phase 3–4 | Real photos, and confirmed prices per stretch and per hotel |
| Phase 6 | Resend API key, if you want email notifications |

**Nothing is blocked right now.** Phase 0 needs none of it. I will start there and stop at the
Phase 1 boundary if the Neon URL has not arrived.

> One thing I will not do without your say-so: the reference screenshots carry ratings ("4.8",
> "1129 reviews"), certification badges ("WRA Certified"), and prices that belong to a competitor.
> I will build those components and seed them with obviously-placeholder values for the client to
> fill in. I will not present them as Ganga Vedha's real credentials.
