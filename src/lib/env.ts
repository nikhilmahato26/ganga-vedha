import { z } from "zod";

/**
 * Environment contract.
 *
 * Public values are validated eagerly at module load, so a bad NEXT_PUBLIC_*
 * fails at boot rather than as `undefined` three screens in. Credentials are
 * validated lazily by the accessor that needs them, which keeps the app
 * buildable and browsable before the Neon and Cloudinary keys arrive without
 * ever letting a half-configured request reach a database.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsedPublic.success) {
  throw new Error(
    `Invalid public environment:\n${z.prettifyError(parsedPublic.error)}`,
  );
}

export const publicEnv = parsedPublic.data;

function required(name: string, value: string | undefined, hint: string): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing ${name}. ${hint}\nCopy .env.example to .env.local and fill it in.`,
    );
  }
  return value.trim();
}

/**
 * Neon expects the POOLED connection string in a serverless runtime — the host
 * containing "-pooler". A direct connection exhausts the instance under any
 * real traffic because every request handler opens its own socket.
 */
export function databaseUrl(): string {
  const url = required(
    "DATABASE_URL",
    process.env.DATABASE_URL,
    "Paste the Neon connection string.",
  );
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error("DATABASE_URL must be a postgres:// or postgresql:// URL.");
  }
  return url;
}

/** True when the database is configured, for pages that degrade gracefully. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Warn once, loudly, if someone wires the unpooled host into a serverless run. */
export function assertPooledConnection(url: string): void {
  if (process.env.NODE_ENV === "production" && !url.includes("-pooler.")) {
    console.warn(
      "[ganga-vedha] DATABASE_URL does not look like Neon's pooled host " +
        "(expected '-pooler' in the hostname). Serverless functions will " +
        "exhaust connections under load.",
    );
  }
}

export function cloudinaryConfig() {
  return {
    cloudName: required(
      "CLOUDINARY_CLOUD_NAME",
      process.env.CLOUDINARY_CLOUD_NAME,
      "Found on the Cloudinary dashboard.",
    ),
    apiKey: required(
      "CLOUDINARY_API_KEY",
      process.env.CLOUDINARY_API_KEY,
      "Found on the Cloudinary dashboard.",
    ),
    apiSecret: required(
      "CLOUDINARY_API_SECRET",
      process.env.CLOUDINARY_API_SECRET,
      "Found on the Cloudinary dashboard. Never expose this to the browser.",
    ),
  };
}

export function hasCloudinary(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function authSecret(): Uint8Array {
  const secret = required(
    "AUTH_SECRET",
    process.env.AUTH_SECRET,
    "Generate one with: openssl rand -base64 32",
  );
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Gmail (or any) SMTP for the new-enquiry notification email. Optional: with
 * no SMTP_USER/SMTP_PASS the site still takes enquiries, it just doesn't
 * email anyone. Validated lazily so a missing value never breaks a build.
 */
export function hasEmail(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

export function emailConfig() {
  const user = required("SMTP_USER", process.env.SMTP_USER, "The Gmail address that sends the alert.");
  const pass = required(
    "SMTP_PASS",
    process.env.SMTP_PASS,
    "A Google app password (16 chars, no spaces) — not the account password.",
  );
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const to = process.env.ENQUIRY_NOTIFY_TO?.trim() || user;
  return { host, port, secure: port === 465, user, pass, to };
}
