# Ganga Vedha — Owner's Handover Guide

This is your guide to running the website day-to-day. It assumes no technical background. If a word here doesn't make sense, that's a documentation problem, not a you problem — ask your developer to fix the doc.

## The one rule that matters most

**Everything you do inside the admin panel is safe and shows up on the live site within seconds.** There is no "publish" step you can forget and no way to break the site by clicking around in there.

**Never edit the database directly** (for example, through the Neon website's own table editor), even if someone shows you how. Changes made that way do *not* appear on the live site — the site needs a developer to rebuild and redeploy it first. If you're ever tempted to do this, ask your developer instead; it's a five-minute job for them and a source of confusing bugs if done outside the admin panel.

## Logging in

1. Go to `yourdomain.com/admin/login` (ask your developer for the exact address once the site is deployed).
2. Sign in with your email (`owner@gangavedha.com`) and your password.
3. If you don't have the password, or think it may have leaked, go to **Settings → Change password** the moment you log in. Changing your password immediately signs out every *other* device signed into your account — the device you're on stays signed in.

Use a password manager. Don't reuse a password from anywhere else.

## The admin menu, section by section

**Dashboard** — A quick snapshot: how many new enquiries came in today/this week/this month, and shortcuts to everything else. This is the first thing you should check each morning.

**Bookings** — This is your enquiry inbox. Every time someone submits a booking enquiry on the site (rafting, bungee, or a hotel), it lands here with their name, phone/WhatsApp, and what they asked about. Move each one through the stages as you handle it: **new → contacted → confirmed → completed** (or **lost**, if it doesn't convert). This is for your own tracking — it doesn't notify the customer. You can also leave private notes on an enquiry for your team.

**Rafting / Bungee / Hotels** — Add, edit, reorder, or remove what you sell. For rafting stretches specifically, each one has its own distance, price, and grade — that's what shows on the card and detail page. Every listing has a **published/unpublished** toggle: unpublish something you're not ready to sell yet, rather than deleting it, so you can bring it back later without re-entering everything.

**Adventures** — Paragliding, zip-lining, and anything else that isn't rafting or the bungee jump. These appear on the site's *Adventures* page. Each one carries its own price, duration, minimum age and weight limits, just like a rafting stretch. Pick "Paragliding" or "Zip lining" as the type when you add one.

**Packages** — The holiday packages (Char Dham, Do Dham, the yoga course, the multi-day tours). Each has a starting-from price, a day-by-day itinerary you can reorder, inclusions/exclusions, notes on accommodation, transport and meals, terms, and an FAQ. Tie a package to a **primary destination** so it also shows on that destination's page. The price on the site is always labelled "from" — you confirm the real quote with the customer.

**Destinations** — The places on the *Stays* page: Haridwar, Rishikesh, Manali, and the rest. Each has an intro, a "best experiences" list, best-time-to-visit and how-to-reach notes. A destination's page automatically pulls in the stays and packages you've tied to it. Tie a hotel to a destination on the hotel's own edit screen (the "Destination" dropdown), and a package on the package's edit screen ("Primary destination").

**Rentals** — Car and bike rental. A car is usually **quote-only** — turn that switch on and leave the daily price blank; the enquiry becomes a request for a custom quotation. A bike carries a real per-day rate and a deposit. Both list the documents a renter must bring and the pickup details.

**Reviews** — Add customer testimonials that appear on the homepage. Only published reviews show up publicly.

**Media** — Every photo you've ever uploaded lives here. If you replace a hotel's cover photo, the old one doesn't get deleted automatically — this screen shows you which uploaded photos are no longer used anywhere on the site, so you can clean them up in bulk instead of them piling up forever.

**Activity** — A running log of every change made in the admin panel: who did what, and when (e.g. "Rafting stretch '24 km Marine Drive' — published"). Useful if you have staff with their own logins later, or if something looks off and you want to know when it changed.

**Settings** — This is where the two most important levers live:

### 1. Closing bookings (the monsoon switch)

On the Dashboard and in Settings, each of the three services — **Rafting**, **Bungee jumping**, **Hotel bookings** — has its own on/off switch, completely independent of the others. Turning one off:
- Immediately stops new enquiries for that service everywhere on the site.
- Shows visitors a closure message instead of a booking form.

Click **Edit message** to write what visitors see when a service is closed (e.g. "Rafting paused for the monsoon — bookings reopen after the rains ease"). Click **Preview** to see exactly what a visitor will see before you save it.

**This is the switch to flip when the river closes for monsoon.** You don't need a developer for this — it's designed to be something you handle yourself, same-day.

### 2. Everything else in Settings

Brand name and tagline, your contact details (WhatsApp, phone, email, address, map link), the homepage hero text, the "river status" strap at the top of the site, an optional site-wide announcement bar, and the four "Why book with us" reasons on the homepage — all editable here, all live instantly on save.

## A few things worth knowing

- **Deleting is permanent** for enquiries and reviews. For rafting/bungee/hotel listings, prefer **unpublish** over delete unless you're sure you'll never need it again.
- **Photos**: upload the best quality image you have — the site automatically resizes it for phones, tablets, and desktops. You don't need to prepare multiple sizes yourself.
- **If the site looks broken or a page won't load**, check Settings first to make sure nothing was accidentally left in a half-saved state, then contact your developer with a screenshot and the page URL.

## If something goes seriously wrong

Contact your developer. Don't try to fix it by editing the database directly — see the rule at the top of this document.
