// One-off export of the old Neon (Postgres) database into SQL that D1 can run.
//
//   node scripts/neon-to-d1.mjs <out.sql>          (reads DATABASE_URL from ../.env.local)
//   pnpm exec wrangler d1 execute ganga-vedha-db --remote --file <out.sql>
//
// The output holds customer enquiries (names, phone numbers): write it OUTSIDE the repo and delete
// it after the import (AGENTS.md §05). Columns are matched by name against migrations/0000_init.sql;
// anything the D1 schema doesn't have is reported and skipped.
import { readFileSync, writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const out = process.argv[2]
if (!out) throw new Error('Usage: node scripts/neon-to-d1.mjs <out.sql>')

const envFile = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
const url = envFile.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m)?.[1]
if (!url) throw new Error('DATABASE_URL not found in .env.local')
const sql = neon(url)

// Parent tables first so every foreign key already has its target.
const TABLES = [
  'admin_users', 'media', 'destinations', 'adventures', 'hotels', 'hotel_rooms', 'packages', 'rentals',
  'media_links', 'gallery_items', 'site_settings', 'service_lines', 'content_blocks', 'closures',
  'enquiries', 'reviews', 'promotions', 'audit_log',
]

/** Column names per table, from the D1 migration. */
const ddl = readFileSync(new URL('../migrations/0000_init.sql', import.meta.url), 'utf8')
const d1Columns = {}
for (const m of ddl.matchAll(/CREATE TABLE `(\w+)` \(([\s\S]*?)\n\);/g)) {
  d1Columns[m[1]] = new Set([...m[2].matchAll(/^\s*`(\w+)`/gm)].map(c => c[1]))
}

const quote = s => `'${String(s).replace(/'/g, "''")}'`
function literal(col, v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? '1' : '0'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') return quote(JSON.stringify(v))
  // timestamptz → the ISO-8601 UTC form every *_at column holds.
  if (/_at$/.test(col)) return quote(new Date(v).toISOString())
  return quote(v)
}

const lines = ['PRAGMA defer_foreign_keys = true;']
const report = []
for (const table of TABLES) {
  const cols = d1Columns[table]
  if (!cols) throw new Error(`No D1 table ${table}`)
  const rows = (await sql.query(`SELECT row_to_json(t) AS r FROM "${table}" t ORDER BY t.id`)).map(x => x.r)
  const skipped = new Set()
  for (const row of rows) {
    const keys = Object.keys(row).filter(k => (cols.has(k) ? true : (skipped.add(k), false)))
    lines.push(`INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(k => literal(k, row[k])).join(', ')});`)
  }
  report.push(`${table.padEnd(16)} ${String(rows.length).padStart(5)} rows${skipped.size ? `  (skipped columns: ${[...skipped].join(', ')})` : ''}`)
}
writeFileSync(out, lines.join('\n') + '\n')
console.log(report.join('\n'))
