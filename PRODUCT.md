# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Neon (serverless Postgres) as the database — connection string to be supplied by the user. Cloudinary for image upload and delivery — credentials to be supplied by the user. Stack was specified by the user in the original brief, not delegated.

## Users

**Primary — the traveller.** Someone planning a Rishikesh trip, most often on a phone, usually 1–14 days ahead, frequently in a group of 4–12 (friends, family, corporate outing). They are comparison-shopping across several operator sites and WhatsApp forwards. Their job: find a rafting stretch that matches their nerve and their budget, confirm it is actually running on their date, and get a human on WhatsApp to lock it in. They are not looking to complete a checkout; they are looking for enough confidence to make contact.

**Secondary — the operator/owner (admin).** Non-technical. Runs the business from a phone or a shared laptop, often on patchy connectivity, often between trips. Their job: keep prices, hotel listings, photos, and — critically — *what is currently bookable* accurate, without calling a developer. During monsoon they need to shut bookings off across the site in seconds.

## Product Purpose

A booking-enquiry site for Ganga Vedha, a Rishikesh adventure operator. It presents three service lines — hotel booking, river rafting, and bungee jumping — converts interest into a captured enquiry with contact details, and hands the traveller to WhatsApp for confirmation. Success is measured in qualified enquiries received, not in page views. A second, equal purpose: the owner can run the entire public site from an admin panel without developer involvement.

## Positioning

Rafting is sold by **distance stretch**, not by generic package name. Each stretch (12 km Brahmpuri, 16 km Shivpuri, 24 km Marine Drive, 26 km, 32 km Kaudiyala) is a distinct bookable product with its own price, duration, difficulty grade, start point, and detail page. Competitors bury this in a dropdown; here it is the primary axis of choice, because distance is the variable travellers actually argue about.

The second differentiator is **honest availability**. Rishikesh rafting is legally and physically suspended for roughly mid-June to mid-September (monsoon; high water). Most operator sites keep "Book Now" live year-round and disappoint people. Ganga Vedha shows a seasonal-closure state that the owner controls, with a reason and a reopening expectation.

## Operating Context

- Traffic is mobile-majority and India-based; treat slow 4G as the design target, not an edge case.
- WhatsApp is the real booking channel. Every conversion path ends there.
- Prices are in INR and change seasonally; the owner must be able to edit them without a deploy.
- The monsoon closure is annual and predictable but its exact dates are not; it is an owner-triggered state, not a hardcoded date range.
- Hotels are a separate inventory the owner adds to over time — each with photos, amenities, room types, and a detail page.
- The owner may be editing content on a phone.

## Capabilities and Constraints

**Confirmed capabilities**
- Public landing page with hero, three service cards (hotel booking / river rafting / bungee jumping), supporting sections, gallery, and reviews.
- Rafting products carry a **km / distance** attribute and are browsable by stretch.
- Detail pages for rafting stretches, bungee, and individual hotels.
- Enquiry capture: name, phone, date, group size, selected product → persisted to Neon → surfaced in an admin inbox → WhatsApp hand-off. **No payment gateway in scope.**
- Admin panel controls: site content, service cards, rafting stretches, bungee, hotels (with Cloudinary image upload), gallery, reviews, and the booking-closed state.
- **Booking-closed** state: a full-screen interstitial with icon, headline, reason copy, a reopening line, and a dismiss action — scoped per service so rafting can be closed while hotels stay open.
- Admin auth: single owner account, email + password hashed in Neon, session cookie. Owner can change their own password.

**Constraints**
- Neon connection string and Cloudinary credentials are not yet supplied; the build must run against local/placeholder config until they arrive.
- No real photography, logo, or copy from the client yet.
- Serverless Postgres: connection pooling must be handled (Neon serverless driver / pooled connection string), not a long-lived pool.

**Terminology**
- *Stretch* — a rafting route defined by its put-in point and distance (e.g. "16 km from Shivpuri").
- *Grade* — difficulty label shown on cards: Easy / Moderate / Challenging.
- *Enquiry* — a captured booking request. Not a paid order.

## Brand Commitments

- Name: **Ganga Vedha**. No logo, photography, or brand assets exist yet; slots must be explicit and obviously placeholder, never fabricated as real.
- The user supplied competitor screenshots (dronecraft.co.in, honeytripadventures.in) as **structural** references — section order and card anatomy — with an explicit instruction that Ganga Vedha carry its own visual identity rather than clone them.
- **Standing visual preference: the category standard, executed at full craft.** Offered a dealt direction round twice (grounded hand, then a bolder foreign-form hand), the user deliberately took the canon exit. Conventions of the adventure-booking category are embraced without irony: full-bleed hero, dark scrim, bold sans headline, warm CTA, rounded cards with rating and duration chips, trust row, testimonial section, sticky WhatsApp. Ganga Vedha's own identity lives in palette, type, and detail — not in refusing the arrangement.
- **Craft bar: Klook, GetYourGuide, and Viator.** Their execution level is the standard this build is measured against — the closest functional neighbours, and best-in-class at presenting priced experiences with duration, difficulty, rating, and availability, scannable on a phone.

## Evidence on Hand

- Four reference screenshots supplied by the user: a full DroneCraft landing page, its three-card adventure row annotated with the three intended service lines, a competitor's rafting-by-km navigation menu, and a monsoon booking-closed interstitial.
- **No real testimonials, review counts, ratings, certifications, safety credentials, customer numbers, or press exist.** Any such figure on the built site must be visibly placeholder and owner-editable. Do not fabricate WRA/certification claims, star ratings, or review counts as if factual.
- No real pricing has been confirmed; figures visible in reference screenshots belong to a competitor and must not be presented as Ganga Vedha's.

## Product Principles

1. **Availability is the first fact.** If a service cannot be booked today, the site says so before it sells. Never take an enquiry for something that is shut.
2. **Distance is the unit of choice.** Rafting is organised, priced, compared, and navigated by kilometres.
3. **The owner ships, not the developer.** Anything that changes seasonally — price, photo, hotel, closure, review — is editable in the admin panel. If a change would need a deploy, that is a design bug.
4. **Every path ends in a human.** The site's job is to get a confident traveller into a WhatsApp conversation, with their details already captured so nothing is lost if they never send the message.
5. **Phone first, weak signal.** Mobile layout, image weight, and admin ergonomics are designed for a phone on 4G, not a desktop on fibre.

## Accessibility & Inclusion

- Indian mobile audience: minimum 16px body text, tap targets ≥44px, and no reliance on hover for any primary action.
- The booking-closed interstitial must be dismissible by keyboard and must trap focus while open.
- Price, grade, and availability must be readable without colour alone carrying the meaning.
