const fs = require("fs");
const path = require("path");
const js = fs.readFileSync(path.join(process.env.TEMP, "bw-base44-app.js"), "utf8");
const i = js.indexOf("abonnement");
console.log("--- abonnement context ---");
console.log(js.slice(Math.max(0, i - 500), i + 900));
console.log("\n--- stripe/buy urls ---");
const urls = [...js.matchAll(/https:\/\/[^\s"'`\\]{8,180}/g)].map((m) => m[0]);
const filtered = [...new Set(urls)].filter((u) =>
  /stripe|buy\.|checkout|blackway|payment|base44/i.test(u),
);
console.log(filtered.slice(0, 50).join("\n"));
console.log("\n--- has bootstrap? ---", js.includes("mobile/bootstrap"));
console.log("--- has grow_hub? ---", js.includes("grow_hub"));
console.log("--- has buy.stripe? ---", js.includes("buy.stripe.com"));
