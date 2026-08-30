"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { enquiries } from "@/db/schema";
import { generateRefCode, normalizePhoneIN } from "@/lib/format";
import {
  enquirySchema,
  type EnquiryInput,
  type EnquiryResult,
} from "@/lib/enquiry-schema";
import { hasDatabase } from "@/lib/env";
import {
  getAdventure,
  getClosures,
  getHotel,
  getPackage,
  getRental,
} from "@/lib/content";
import { isBookable } from "@/lib/closure";

const WINDOW_MINUTES = 10;
const MAX_PER_WINDOW = 5;

/**
 * A per-process in-memory counter gives zero real protection: a serverless
 * deployment runs many short-lived instances that share no memory, so a
 * spammer just gets a fresh counter on the next cold start. The rate limit
 * has to live where every instance can see it — the table itself.
 */
async function isRateLimited(phone: string): Promise<boolean> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enquiries)
    .where(
      and(
        eq(enquiries.phone, phone),
        gt(enquiries.createdAt, sql`now() - interval '${sql.raw(String(WINDOW_MINUTES))} minutes'`),
      ),
    );
  return Number(count) >= MAX_PER_WINDOW;
}

async function hashIp(): Promise<string | null> {
  try {
    const h = await headers();
    const ip =
      h.get("x-real-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    if (!ip) return null;
    // Hashed, never stored raw — this exists for coarse abuse detection, not
    // as a durable record of who visited.
    return createHash("sha256").update(ip).digest("hex").slice(0, 64);
  } catch {
    return null;
  }
}

export async function submitEnquiry(raw: EnquiryInput): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  // Silently accept the honeypot so a bot never learns it was caught.
  if (data.website) {
    return { ok: true, refCode: generateRefCode(), productName: "", persisted: false };
  }

  const phone = normalizePhoneIN(data.phone)!;

  if (hasDatabase() && (await isRateLimited(phone))) {
    return {
      ok: false,
      fieldErrors: {},
      formError:
        "We've already got a few enquiries from this number. Message us on WhatsApp and we'll pick it up there.",
    };
  }

  const isAdventureKind =
    data.productKind === "rafting" ||
    data.productKind === "bungee" ||
    data.productKind === "paragliding" ||
    data.productKind === "zipline";

  // A general contact-form message: no product, no closure check, no price.
  if (data.productKind === "general") {
    const refCode = generateRefCode();
    const productName = data.subject || "General enquiry";
    if (hasDatabase()) {
      const [ipHash, userAgent] = await Promise.all([
        hashIp(),
        headers()
          .then((h) => h.get("user-agent")?.slice(0, 300) ?? null)
          .catch(() => null),
      ]);
      await getDb()
        .insert(enquiries)
        .values({
          refCode,
          productKind: "general",
          productNameSnapshot: productName,
          subject: data.subject || null,
          name: data.name,
          phone,
          email: data.email || null,
          travelDate: data.travelDate || null,
          groupSize: data.groupSize,
          message: data.message || null,
          source: data.source,
          ipHash,
          userAgent,
        });
    } else {
      console.info(
        `[enquiry, no DB configured] ${refCode} · GENERAL · ${data.subject} · ${phone}`,
      );
    }
    return { ok: true, refCode, productName, persisted: hasDatabase() };
  }

  // Resolve the product server-side. Never trust a price or a name that
  // arrived from the browser.
  const product =
    data.productKind === "hotel"
      ? await getHotel(data.productSlug)
      : data.productKind === "package"
        ? await getPackage(data.productSlug)
        : data.productKind === "rental"
          ? await getRental(data.productSlug)
          : await getAdventure(data.productSlug);

  if (!product) {
    return {
      ok: false,
      fieldErrors: {},
      formError: "That trip is no longer listed. Pick another and we'll sort it out.",
    };
  }

  // An enquiry must never be taken for something that cannot run. Packages and
  // rentals have no service-level closure, but an entity closure still applies
  // to a rafting/bungee listing.
  if (isAdventureKind || data.productKind === "hotel") {
    const service =
      data.productKind === "hotel"
        ? "hotel"
        : data.productKind === "rafting" || data.productKind === "bungee"
          ? data.productKind
          : "activity";
    const closures = await getClosures();
    const open = isBookable(closures, {
      service,
      entityType: data.productKind === "hotel" ? "hotel" : "adventure",
      entityId: product.id,
    });
    if (!open) {
      return {
        ok: false,
        fieldErrors: {},
        formError:
          "Bookings for this are closed right now. Leave us a WhatsApp message and we'll tell you the moment they reopen.",
      };
    }
  }

  const refCode = generateRefCode();
  const priceSnapshot =
    "pricePerNightInr" in product
      ? product.pricePerNightInr
      : "priceInr" in product
        ? product.priceInr
        : "perDayInr" in product
          ? product.perDayInr
          : null;

  // The stored product_kind: rafting/bungee keep their own; paragliding and
  // zip-lining collapse to `activity`; everything else is itself.
  const storedKind: "rafting" | "bungee" | "hotel" | "package" | "rental" | "activity" =
    data.productKind === "paragliding" || data.productKind === "zipline"
      ? "activity"
      : data.productKind;

  if (hasDatabase()) {
    const [ipHash, userAgent] = await Promise.all([
      hashIp(),
      headers()
        .then((h) => h.get("user-agent")?.slice(0, 300) ?? null)
        .catch(() => null),
    ]);

    await getDb()
      .insert(enquiries)
      .values({
        refCode,
        productKind: storedKind,
        adventureId: isAdventureKind ? product.id : null,
        hotelId: data.productKind === "hotel" ? product.id : null,
        packageId: data.productKind === "package" ? product.id : null,
        rentalId: data.productKind === "rental" ? product.id : null,
        productNameSnapshot: product.name,
        productPriceSnapshotInr: priceSnapshot,
        name: data.name,
        phone,
        email: data.email || null,
        travelDate: data.travelDate || null,
        groupSize: data.groupSize,
        message: data.message || null,
        source: data.source,
        ipHash,
        userAgent,
      });
  } else {
    console.info(
      `[enquiry, no DB configured] ${refCode} · ${product.name} @ ₹${priceSnapshot ?? "quote"} · ${phone} · ` +
        `${data.travelDate || "no date"} · ${data.groupSize} pax · via ${data.source}`,
    );
  }

  return {
    ok: true,
    refCode,
    productName: product.name,
    persisted: hasDatabase(),
  };
}
