#!/usr/bin/env node
/**
 * pipe/ and sentinel/ are Workers without a Vite app. Cloudflare preview
 * builds often still run `npm run build` (copied from blackway-site).
 */
console.log("No frontend build for this Worker.");
