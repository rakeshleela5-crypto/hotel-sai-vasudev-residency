import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function cloudflarePagesPlugin() {
  return {
    name: 'cloudflare-pages-spa',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      
      // 1. Ensure dist/_redirects has the standard Cloudflare Pages SPA rewrite
      const redirectsFile = path.join(distDir, '_redirects')
      try {
        fs.writeFileSync(redirectsFile, '/* /index.html 200\n', 'utf8')
        console.log('[vite-plugin] Verified dist/_redirects for Cloudflare Pages SPA routing.')
      } catch (e) {
        console.warn('[vite-plugin] Could not write dist/_redirects:', e)
      }

      // 2. Generate 200.html as supplementary fallback
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
  plugins: [react(), cloudflarePagesPlugin()],
  build: {
    emptyOutDir: true,
  },
})
