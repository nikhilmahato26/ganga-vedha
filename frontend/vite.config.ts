import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `@/…` = frontend/src, kept from the original Next.js app. Files the API Worker also imports
  // (lib/schemas, format, closure, hero-rooms, …) use relative imports only (ARCHITECTURE.md §11).
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173 },
})
