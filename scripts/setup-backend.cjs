const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[setup-backend] Preparing Python & Uvicorn runtime for Render...');

if (process.platform === 'win32') {
  console.log('[setup-backend] Running on Windows (local environment). Skipping Linux shim creation.');
  process.exit(0);
}

const projectRoot = path.resolve(__dirname, '..');
const nodeBinDir = path.dirname(process.execPath);
console.log('[setup-backend] Node binary directory:', nodeBinDir);

try {
  // 1. Install uv (standalone Python runtime & package installer)
  console.log('[setup-backend] Installing uv standalone Python installer...');
  execSync('curl -LsSf https://astral.sh/uv/install.sh | sh', {
    stdio: 'inherit',
    env: process.env,
  });

  const homeDir = process.env.HOME || '/root';
  const uvBin = path.join(homeDir, '.local', 'bin', 'uv');
  const venvDir = path.join(projectRoot, '.venv');
  const reqFile = path.join(projectRoot, 'backend', 'requirements.txt');

  console.log('[setup-backend] Creating Python 3.11 virtual environment...');
  execSync(`"${uvBin}" venv "${venvDir}" --python 3.11`, { stdio: 'inherit' });

  console.log('[setup-backend] Installing backend requirements...');
  const pyBin = path.join(venvDir, 'bin', 'python');
  execSync(`"${uvBin}" pip install --python "${pyBin}" -r "${reqFile}"`, { stdio: 'inherit' });

  // 2. Generate robust uvicorn executable shim
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
  // Fallback: try system python3 if present
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
