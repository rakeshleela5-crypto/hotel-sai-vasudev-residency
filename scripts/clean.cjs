const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// Purge dist folder to wipe any cached files restored by Cloudflare build output cache
if (fs.existsSync(distDir)) {
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('[clean] Cleared dist directory and cached build outputs.');
  } catch (err) {
    console.warn('[clean] Warning while clearing dist:', err.message);
  }
}

// Ensure public/_redirects is never present
const publicRedirects = path.join(projectRoot, 'public', '_redirects');
if (fs.existsSync(publicRedirects)) {
  try {
    fs.rmSync(publicRedirects, { force: true });
    console.log('[clean] Removed public/_redirects.');
  } catch (e) {}
}
