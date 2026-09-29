/**
 * MASTER KING LEADS — scoring chirurgical B2B.
 * Cible : entreprises (Canada, USA, Europe, reste du monde).
 * Un lead sans entreprise n'entre pas.
 */

export const FREE_MAIL = [
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.ca", "hotmail.fr",
  "outlook.com", "outlook.fr", "yahoo.com", "yahoo.ca", "yahoo.fr",
  "icloud.com", "live.ca", "live.com", "videotron.ca", "sympatico.ca",
  "proton.me", "protonmail.com", "aol.com", "gmx.com", "gmx.de", "web.de",
];

export const MARKETS = {
  CA: { label: "Canada", slaBoost: 0 },
  US: { label: "United States", slaBoost: 0 },
  EU: { label: "Europe", slaBoost: 0 },
  UK: { label: "United Kingdom", slaBoost: 0 },
  LATAM: { label: "Latin America", slaBoost: 15 },
  APAC: { label: "Asia-Pacific", slaBoost: 30 },
  WORLD: { label: "Worldwide", slaBoost: 20 },
};

const EU_CC = new Set([
  "fr", "de", "es", "it", "nl", "be", "pt", "at", "ie", "pl", "se", "dk",
  "fi", "no", "ch", "cz", "ro", "hu", "gr", "lu", "sk", "si", "hr", "ee",
  "lv", "lt", "bg", "cy", "mt",
]);

const TLD_MARKET = {
  ca: "CA", qc: "CA", us: "US", eu: "EU", uk: "UK", fr: "EU", de: "EU",
  es: "EU", it: "EU", nl: "EU", be: "EU", pt: "EU", ie: "UK", pl: "EU",
  se: "EU", dk: "EU", fi: "EU", no: "EU", ch: "EU", mx: "LATAM", br: "LATAM",
  ar: "LATAM", cl: "LATAM", co: "LATAM", au: "APAC", nz: "APAC", sg: "APAC",
  jp: "APAC", in: "APAC", hk: "APAC",
};

const PHONE_MARKET = [
  [/^(\+|00)1/, "NA"],
  [/^(\+|00)44/, "UK"],
  [/^(\+|00)33/, "EU"],
  [/^(\+|00)49/, "EU"],
  [/^(\+|00)34/, "EU"],
  [/^(\+|00)39/, "EU"],
  [/^(\+|00)31/, "EU"],
  [/^(\+|00)32/, "EU"],
  [/^(\+|00)351/, "EU"],
  [/^(\+|00)353/, "UK"],
  [/^(\+|00)46/, "EU"],
  [/^(\+|00)47/, "EU"],
  [/^(\+|00)41/, "EU"],
  [/^(\+|00)48/, "EU"],
  [/^(\+|00)61/, "APAC"],
  [/^(\+|00)81/, "APAC"],
  [/^(\+|00)65/, "APAC"],
  [/^(\+|00)91/, "APAC"],
  [/^(\+|00)52/, "LATAM"],
  [/^(\+|00)55/, "LATAM"],
];

const CA_AREA = new Set([
  "204", "226", "236", "249", "250", "263", "289", "306", "343", "354",
  "365", "367", "368", "403", "416", "418", "431", "437", "438", "450",
  "468", "474", "506", "514", "519", "548", "579", "581", "584", "587",
  "604", "613", "639", "647", "672", "683", "705", "709", "742", "753",
  "778", "780", "782", "807", "819", "825", "867", "873", "879", "902",
  "905", "942",
]);

export function domainOf(email) {
  return String(email || "").split("@")[1]?.toLowerCase().trim() || "";
}

export function isBusinessEmail(email) {
  const d = domainOf(email);
  return !!d && !FREE_MAIL.includes(d);
}

export function inferMarket(p) {
  const country = String(p.pays || p.country || "").trim().toUpperCase();
  if (country === "CA" || country === "CANADA") return "CA";
  if (country === "US" || country === "USA" || country === "UNITED STATES") return "US";
  if (country === "UK" || country === "GB" || country === "UNITED KINGDOM") return "UK";
  if (country === "EU" || EU_CC.has(country.toLowerCase())) return "EU";
  if (country.length === 2 && TLD_MARKET[country.toLowerCase()]) return TLD_MARKET[country.toLowerCase()];

  const tld = domainOf(p.email).split(".").pop();
  if (tld && TLD_MARKET[tld]) return TLD_MARKET[tld];

  const phone = String(p.telephone || p.phone || "").replace(/[\s().-]/g, "");
  for (const [rx, m] of PHONE_MARKET) {
    if (rx.test(phone)) {
      if (m === "NA") {
        const digits = phone.replace(/^\+?1/, "");
        const area = digits.slice(0, 3);
        return CA_AREA.has(area) ? "CA" : "US";
      }
      return m;
    }
  }
  if (p.langue === "fr" || p.lang === "fr") return "CA";
  return "WORLD";
}

function sizePoints(taille) {
  const t = String(taille || "").toLowerCase();
  if (t.includes("201") || t.includes("500") || t === "enterprise") return 14;
  if (t.includes("51") || t.includes("200")) return 12;
  if (t.includes("11") || t.includes("50")) return 10;
  if (t.includes("1-10") || t === "solo" || t === "1") return 4;
  return 0;
}

function intentPoints(intent) {
  const i = String(intent || "").toLowerCase();
  if (i === "qualified_leads" || i === "master_leads") return 16;
  if (i === "full_ops" || i === "service_complet") return 14;
  if (i === "leak_audit" || i === "fuites") return 10;
  if (i === "chatbot") return 8;
  return 6;
}

/**
 * @returns {{
 *   ok: boolean,
 *   erreur?: string,
 *   score: number,
 *   grade: "KING"|"SURGICAL"|"WARM"|"REJECT",
 *   market: string,
 *   marketLabel: string,
 *   slaMinutes: number,
 *   urgence: string,
 *   icp: string,
 *   reasons: string[],
 *   briefing: string
 * }}
 */
export function scoreKingLead(p) {
  const entreprise = String(p.entreprise || p.company || "").trim();
  const email = String(p.email || "").trim().toLowerCase();
  const phone = String(p.telephone || p.phone || "").trim();
  const message = String(p.message || "").trim();
  const reasons = [];
  let s = 20;

  if (!email || !email.includes("@")) {
    return fail("courriel requis");
  }
  if (!entreprise || entreprise.length < 2) {
    return fail("entreprise obligatoire — leads B2B seulement");
  }

  s += 22;
  reasons.push("entreprise");

  if (isBusinessEmail(email)) {
    s += 16;
    reasons.push("courriel pro");
  } else {
    s -= 8;
    reasons.push("courriel grand public");
  }

  if (phone.replace(/\D/g, "").length >= 8) {
    s += 10;
    reasons.push("telephone");
  }

  const sz = sizePoints(p.taille || p.company_size);
  s += sz;
  if (sz) reasons.push("taille");

  const market = inferMarket(p);
  if (market === "CA" || market === "US" || market === "EU" || market === "UK") {
    s += 12;
    reasons.push("marche prioritaire " + market);
  } else {
    s += 8;
    reasons.push("marche mondial " + market);
  }

  s += intentPoints(p.intent || p.besoin);
  reasons.push("intent");

  if (message.length >= 40) {
    s += 8;
    reasons.push("brief");
  }

  const industrie = String(p.industrie || p.industry || "").trim();
  if (industrie) {
    s += 4;
    reasons.push("industrie");
  }

  s = Math.max(0, Math.min(100, s));

  let grade = "WARM";
  if (s >= 80) grade = "KING";
  else if (s >= 64) grade = "SURGICAL";
  else if (s < 45) grade = "REJECT";

  const slaMinutes =
    grade === "KING" ? 15 + (MARKETS[market]?.slaBoost || 0) :
    grade === "SURGICAL" ? 30 + (MARKETS[market]?.slaBoost || 0) :
    grade === "WARM" ? 240 :
    1440;

  const urgence =
    grade === "KING" || grade === "SURGICAL" ? "elevee" : "normal";

  const briefing = [
    `KING LEADS ${grade} · ${s}/100`,
    `Marche: ${MARKETS[market]?.label || market} (${market})`,
    `SLA premier contact: ${slaMinutes} min`,
    `Entreprise: ${entreprise}`,
    industrie ? `Industrie: ${industrie}` : null,
    p.taille ? `Taille: ${p.taille}` : null,
    p.intent || p.besoin ? `Besoin: ${p.intent || p.besoin}` : null,
    `Signaux: ${reasons.join(", ")}`,
    message ? `Brief:\n${message}` : null,
  ].filter(Boolean).join("\n");

  return {
    ok: true,
    score: s,
    grade,
    market,
    marketLabel: MARKETS[market]?.label || market,
    slaMinutes,
    urgence,
    icp: "b2b_entreprise",
    reasons,
    briefing,
  };
}

function fail(erreur) {
  return {
    ok: false,
    erreur,
    score: 0,
    grade: "REJECT",
    market: "WORLD",
    marketLabel: "Worldwide",
    slaMinutes: 1440,
    urgence: "normal",
    icp: "invalide",
    reasons: [erreur],
    briefing: erreur,
  };
}
