#!/usr/bin/env node
/**
 * Point node_modules/.bin/wrangler at scripts/wrangler-ci.cjs so Cloudflare
 * Workers Builds (`npx wrangler versions upload`) picks the pipe/sentinel
 * config when WRANGLER_CI_OVERRIDE_NAME is set.
 */
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const binPath = path.join(repoRoot, "node_modules", ".bin", "wrangler");
const wrapperPath = path.join(repoRoot, "scripts", "wrangler-ci.cjs");

if (!fs.existsSync(binPath) || !fs.existsSync(wrapperPath)) {
  process.exit(0);
}

const shim = `#!/usr/bin/env node
require(${JSON.stringify(wrapperPath)});
`;

try {
  try {
    fs.unlinkSync(binPath);
  } catch {
    /* ignore missing bin */
  }
  fs.writeFileSync(binPath, shim, { mode: 0o755 });
} catch {
  process.exit(0);
}
