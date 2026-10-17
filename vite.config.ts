import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function cleanCloudflareAssetsPlugin() {
  return {
    name: 'clean-cloudflare-assets',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      
      // 1. Permanently remove any _redirects file so Cloudflare never sees it
      const redirectsFile = path.join(distDir, '_redirects')
      if (fs.existsSync(redirectsFile)) {
        try {
          fs.rmSync(redirectsFile, { force: true })
          console.log('[vite-plugin] Removed invalid _redirects file from dist.')
        } catch (e) {
          console.warn('[vite-plugin] Could not remove _redirects:', e)
        }
      }

      // 2. Generate 200.html for native SPA routing
      const indexHtml = path.join(distDir, 'index.html')
      const fallback200 = path.join(distDir, '200.html')
      if (fs.existsSync(indexHtml)) {
        try {
          fs.copyFileSync(indexHtml, fallback200)
          console.log('[vite-plugin] Generated dist/200.html for SPA routing.')
        } catch (e) {
          console.warn('[vite-plugin] Could not generate 200.html:', e)
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cleanCloudflareAssetsPlugin()],
  build: {
    emptyOutDir: true,
  },
})
