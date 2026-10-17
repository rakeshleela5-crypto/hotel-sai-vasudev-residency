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

// 2. Only prepare Python backend runtime if building on Render
if (!process.env.RENDER) {
  console.log('[setup-backend] Non-Render environment detected (Cloudflare Pages / Local). Skipping Python backend setup.');
  process.exit(0);
}

if (process.platform === 'win32') {
  console.log('[setup-backend] Running on Windows. Skipping Linux shim creation.');
  process.exit(0);
}

console.log('[setup-backend] Preparing Python & Uvicorn runtime for Render...');
const nodeBinDir = path.dirname(process.execPath);
console.log('[setup-backend] Node binary directory:', nodeBinDir);

try {
  // Install uv (standalone Python runtime & package installer)
  console.log('[setup-backend] Installing uv standalone Python installer...');
  execSync('curl -LsSf https://astral.sh/uv/install.sh | sh', {
    stdio: 'inherit',
    env: process.env,
  });

  const homeDir = process.env.HOME || '/root';
  const uvBin = path.join(homeDir, '.local', 'bin', 'uv');
  const venvDir = path.join(projectRoot, '.venv');
  const reqFile = path.join(projectRoot, 'backend', 'requirements.txt');

  console.log('[setup-backend] Creating/refreshing Python 3.11 virtual environment...');
  execSync(`"${uvBin}" venv "${venvDir}" --clear --python 3.11`, { stdio: 'inherit' });

  console.log('[setup-backend] Installing backend requirements...');
  const pyBin = path.join(venvDir, 'bin', 'python');
  execSync(`"${uvBin}" pip install --python "${pyBin}" -r "${reqFile}"`, { stdio: 'inherit' });

  // Generate robust uvicorn executable shim
  const uvicornShimContent = `#!/usr/bin/env bash
PROJECT_DIR="${projectRoot}"
export PYTHONPATH="$PROJECT_DIR/backend:$PROJECT_DIR:\$PYTHONPATH"
if [ -f "$PROJECT_DIR/.venv/bin/uvicorn" ]; then
    exec "$PROJECT_DIR/.venv/bin/uvicorn" "$@"
elif [ -f "${uvBin}" ]; then
    exec "${uvBin}" run --directory "$PROJECT_DIR/backend" uvicorn "$@"
else
    exec python3 -m uvicorn "$@"
fi
`;

  const targetLocations = [
    path.join(nodeBinDir, 'uvicorn'),
    path.join(projectRoot, 'node_modules', '.bin', 'uvicorn'),
    path.join(projectRoot, 'uvicorn'),
    path.join(homeDir, '.local', 'bin', 'uvicorn'),
  ];

  for (const target of targetLocations) {
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, uvicornShimContent, { mode: 0o777 });
      fs.chmodSync(target, 0o777);
      console.log('[setup-backend] Successfully placed uvicorn shim at:', target);
    } catch (writeErr) {
      console.warn('[setup-backend] Warning: could not write to', target, writeErr.message);
    }
  }

  console.log('[setup-backend] Runtime preparation complete!');
} catch (err) {
  console.error('[setup-backend] Warning during uv setup:', err.message);
  try {
    console.log('[setup-backend] Attempting system python3 fallback...');
    execSync('python3 -m pip install -r backend/requirements.txt', { stdio: 'inherit' });
    const pyShim = `#!/usr/bin/env bash\nexport PYTHONPATH="${projectRoot}/backend:${projectRoot}:\\$PYTHONPATH"\nexec python3 -m uvicorn "$@"\n`;
    const fallbackTarget = path.join(nodeBinDir, 'uvicorn');
    fs.writeFileSync(fallbackTarget, pyShim, { mode: 0o777 });
    fs.chmodSync(fallbackTarget, 0o777);
  } catch (fallbackErr) {
    console.error('[setup-backend] Fallback failed:', fallbackErr.message);
  }
}
