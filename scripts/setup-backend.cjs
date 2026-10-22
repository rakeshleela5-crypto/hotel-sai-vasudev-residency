const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// Ensure dist/_redirects exists for Cloudflare Pages
const distRedirects = path.join(distDir, '_redirects');
if (!fs.existsSync(distRedirects)) {
  try {
    fs.writeFileSync(distRedirects, '/* /index.html 200\n', 'utf8');
    console.log('[setup-backend] Ensured dist/_redirects exists');
  } catch (e) {
    console.warn('[setup-backend] Could not write dist/_redirects:', e.message);
  }
}

// Ensure dist/200.html exists for SPA fallback
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

// Ensure dist/_headers exists for Cloudflare Pages security headers
const publicHeaders = path.join(projectRoot, 'public', '_headers');
const distHeaders = path.join(distDir, '_headers');
if (fs.existsSync(publicHeaders) && fs.existsSync(distDir)) {
  try {
    fs.copyFileSync(publicHeaders, distHeaders);
    console.log('[setup-backend] Ensured production security headers copied to dist/_headers');
  } catch (e) {
    console.warn('[setup-backend] Note: could not copy _headers:', e.message);
  }
}
