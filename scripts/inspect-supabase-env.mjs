import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "apps", "web", ".env.local");
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
for (const k of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  const hits = lines.filter((l) => l.startsWith(`${k}=`));
  console.log(`${k}: occurrences=${hits.length}`);
  for (const line of hits) {
    const v = line.slice(k.length + 1);
    console.log(
      `  len=${v.length} starts=${JSON.stringify(v.slice(0, 40))} ends=${JSON.stringify(v.slice(-24))} quotes=${v.includes('"')}`,
    );
  }
}
