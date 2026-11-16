import { defineConfig } from 'drizzle-kit'

/** Generates SQL migrations only (`pnpm db:generate`); Wrangler applies them to D1 (`pnpm db:migrate`). */
export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  strict: true,
  verbose: true,
})
