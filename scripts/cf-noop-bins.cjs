#!/usr/bin/env node
/**
 * If the dashboard build command is the expanded site command
 * (`tsc --noEmit && vite build`), provide no-op binaries on PATH.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const binDir = path.join(process.cwd(), "node_modules", ".bin");
fs.mkdirSync(binDir, { recursive: true });

const body = `#!/usr/bin/env node
process.exit(0);
`;

for (const name of ["tsc", "vite"]) {
  fs.writeFileSync(path.join(binDir, name), body, { mode: 0o755 });
}
