const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

// 1. Always create dist/200.html for SPA fallback on Cloudflare Pages / Static Hosts
const distDir = path.join(projectRoot, 'dist');
const distRedirects = path.join(distDir, '_redirects');
if (fs.existsSync(distRedirects)) {
  try {
    fs.rmSync(distRedirects, { force: true });
    console.log('[setup-backend] Removed stale dist/_redirects from build output cache');
  } catch (e) {}
}

const indexHtml = path.join(distDir, 'index.html');
const html200 = path.join(distDir, '200.html');
if (fs.existsSync(indexHtml)) {
  try {
    fs.copyFileSync(indexHtml, html200);
    console.log('[setup-backend] Created dist/200.html for SPA routing fallback');
  } catch (e) {
    console.warn('[setup-backend] Note: could not copy 200.html:', e.message);
  }
}

// 2. Legacy Render runtime setup removed. Frontend deploys directly to Cloudflare Pages.

