/** BlackWay AI Secretary — /api/chat logic (Workers AI + deterministic fallback). */

export type ChatLang = "fr" | "en";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type PlanKey =
  | "grow_hub_spark"
  | "grow_hub_launch"
  | "grow_hub_growth"
  | "grow_hub_scale"
  | "grow_hub_command"
  | "grow_hub_partner";

export type ChatAction =
  | { type: "navigate"; path: string; label: string }
  | { type: "checkout"; plan: PlanKey; label: string }
  | { type: "capture_lead" }
  | { type: "contact" };

export type ChatResult = {
  reply: string;
  actions: ChatAction[];
  engine: "workers_ai" | "openai" | "fallback";
  aiError?: string;
};

type CheckoutLinks = Record<PlanKey, string>;

const PLANS: Record<
  PlanKey,
  { name: string; amountCad: number; blurbFr: string; blurbEn: string }
> = {
  grow_hub_spark: {
    name: "Spark",
    amountCad: 99,
    blurbFr: "Entrée légère — pipeline simple + secrétaire IA 24h.",
    blurbEn: "Light entry — simple pipeline + 24/7 AI secretary.",
  },
  grow_hub_launch: {
    name: "Launch",
    amountCad: 249,
    blurbFr: "Pipeline structuré + relances pour sortir du chaos boîte courriel.",
    blurbEn: "Structured pipeline + follow-ups to exit inbox chaos.",
  },
  grow_hub_growth: {
    name: "Growth",
    amountCad: 499,
    blurbFr: "Moteur recommandé — score, relances, soumissions et paiements mesurés.",
    blurbEn: "Recommended engine — scoring, follow-ups, quotes and payments measured.",
  },
  grow_hub_scale: {
    name: "Scale",
    amountCad: 749,
    blurbFr: "Multi-équipes et multi-marchés — automatisations avancées.",
    blurbEn: "Multi-team and multi-market — advanced automation.",
  },
  grow_hub_command: {
    name: "Command",
    amountCad: 1249,
    blurbFr: "Ops CRM + acquisition gérée quand la fuite exige de l’exécution.",
    blurbEn: "CRM ops + managed acquisition when leakage needs execution.",
  },
  grow_hub_partner: {
    name: "Partner",
    amountCad: 2499,
    blurbFr: "Plateforme + mandat — puissance agence, discipline SaaS.",
    blurbEn: "Platform + retainer — agency horsepower, SaaS discipline.",
  },
};

const DEFAULT_CHECKOUT: CheckoutLinks = {
  grow_hub_spark: "https://buy.stripe.com/00w14m2HH4wX57M2d0eIw0w",
  grow_hub_launch: "https://buy.stripe.com/aFaaEWeqpd3t57M6tgeIw0z",
  grow_hub_growth: "https://buy.stripe.com/28E8wO8218NdfMq5pceIw0x",
  grow_hub_scale: "https://buy.stripe.com/3cI5kC0zz5B143IbNAeIw0B",
  grow_hub_command: "https://buy.stripe.com/fZucN4eqp7J97fU18WeIw0y",
  grow_hub_partner: "https://buy.stripe.com/6oUaEW9655B11VA4l8eIw0A",
};

function knowledge(lang: ChatLang): string {
  const priceLine = Object.values(PLANS)
    .map((p) => `${p.name}: $${p.amountCad} CAD/mo`)
    .join(" · ");
  if (lang === "en") {
    return [
      "BlackWayConnect = bilingual lead-to-revenue platform (Québec / Canada + US).",
      "Grow Hub monthly plans (Stripe CAD, never invent other prices): " + priceLine,
      "Enterprise = custom via /contact. Master Tools at /outils (relance panier, soumission Stripe, checklist, ROI, Leak Score, Grow Hub).",
      "Pages: /outils, /outils/relance-panier, /outils/soumission, /outils/checklist, /grow-hub, /diagnostic, /forfaits, /forfaits-growth, /faq, /contact.",
      "Site and app inquiries + Stripe events sync into HubSpot. Contact: serviceclient@blackwayconnect.com.",
      "You are available 24/7. Qualify need, guide to the right page, offer lead capture or Stripe subscribe when ready.",
      "Never invent discounts, testimonials, case studies, or prices outside the catalog above. Tone: confident, concise, revenue-ops — no fluff.",
    ].join("\n");
  }
  return [
    "BlackWayConnect = plateforme lead-to-revenue bilingue (Québec / Canada + É.-U.).",
    "Forfaits Grow Hub mensuels (Stripe CAD, jamais inventer d'autres prix) : " + priceLine,
    "Entreprise = sur devis via /contact. Master Tools : /outils (relance panier, soumission Stripe, checklist, ROI, Leak Score, Grow Hub).",
    "Pages : /outils, /outils/relance-panier, /outils/soumission, /outils/checklist, /grow-hub, /diagnostic, /forfaits, /forfaits-growth, /faq, /contact.",
    "Demandes site/app + événements Stripe synchronisés vers HubSpot. Contact : serviceclient@blackwayconnect.com.",
    "Tu es disponible 24h/24. Qualifie le besoin, guide vers la bonne page, propose capture de lead ou abonnement Stripe si prêt.",
    "N'invente jamais de rabais, témoignages, études de cas ou prix hors catalogue. Ton : confiant, concis, ops revenu — zéro remplissage.",
  ].join("\n");
}

function systemPrompt(lang: ChatLang): string {
  const base =
    lang === "en"
      ? "You are BlackWay AI Secretary — professional Québec bilingual revenue-ops secretary for BlackWayConnect. Concise (2–4 short sentences), warm, decisive. Reply in English unless the user writes French."
      : "Tu es la Secrétaire IA BlackWay — secrétaire ops revenus professionnelle, bilingue Québec, pour BlackWayConnect. Concise (2–4 phrases courtes), chaleureuse, décisive. Réponds en français sauf si l'utilisateur écrit en anglais.";
  return `${base}

${knowledge(lang)}

After your reply, append exactly one line:
@@META:{"intent":"faq|pricing|navigate|capture_lead|checkout|consult","plan":null|"grow_hub_spark"|"grow_hub_launch"|"grow_hub_growth"|"grow_hub_scale"|"grow_hub_command"|"grow_hub_partner","path":null|"/diagnostic"|"/grow-hub"|"/outils"|"/forfaits"|"/faq"|"/contact"|"/services"}`;
}

type Meta = {
  intent?: string;
  plan?: PlanKey | null;
  path?: string | null;
};

function parseMeta(raw: string): { reply: string; meta: Meta } {
  const m = raw.match(/@@META:\s*(\{[\s\S]*\})\s*$/);
  if (!m) return { reply: raw.trim(), meta: {} };
  const reply = raw.slice(0, m.index).trim();
  try {
    return { reply, meta: JSON.parse(m[1]) as Meta };
  } catch {
    return { reply: raw.replace(/@@META:[\s\S]*$/, "").trim(), meta: {} };
  }
}

function navLabel(path: string, lang: ChatLang): string {
  const map: Record<string, { fr: string; en: string }> = {
    "/diagnostic": { fr: "Faire le diagnostic", en: "Run the diagnostic" },
    "/grow-hub": { fr: "Voir Grow Hub", en: "Open Grow Hub" },
    "/outils": { fr: "Master Tools", en: "Master Tools" },
    "/forfaits": { fr: "Voir les forfaits", en: "See plans" },
    "/faq": { fr: "FAQ", en: "FAQ" },
    "/contact": { fr: "Consultation", en: "Book a consult" },
    "/services": { fr: "Services", en: "Services" },
  };
  return map[path]?.[lang] || path;
}

function checkoutLabel(plan: PlanKey, lang: ChatLang): string {
  const p = PLANS[plan];
  return lang === "en"
    ? `Subscribe ${p.name} — $${p.amountCad}/mo`
    : `S’abonner ${p.name} — ${p.amountCad} $/mois`;
}

function actionsFromMeta(meta: Meta, lang: ChatLang): ChatAction[] {
  const actions: ChatAction[] = [];
  const intent = meta.intent || "";
  if (meta.path && typeof meta.path === "string" && meta.path.startsWith("/")) {
    actions.push({ type: "navigate", path: meta.path, label: navLabel(meta.path, lang) });
  }
  if (meta.plan && PLANS[meta.plan]) {
    actions.push({
      type: "checkout",
      plan: meta.plan,
      label: checkoutLabel(meta.plan, lang),
    });
  }
  if (intent === "capture_lead" || intent === "consult") {
    actions.push({ type: "capture_lead" });
  }
  if (intent === "consult" && !actions.some((a) => a.type === "navigate")) {
    actions.push({ type: "navigate", path: "/contact", label: navLabel("/contact", lang) });
  }
  if (intent === "pricing" && !meta.plan) {
    (["grow_hub_spark", "grow_hub_growth", "grow_hub_command"] as PlanKey[]).forEach((plan) => {
      actions.push({ type: "checkout", plan, label: checkoutLabel(plan, lang) });
    });
    if (!actions.some((a) => a.type === "navigate" && a.path === "/forfaits")) {
      actions.push({ type: "navigate", path: "/forfaits", label: navLabel("/forfaits", lang) });
    }
    actions.push({ type: "navigate", path: "/outils", label: navLabel("/outils", lang) });
  }
  if (intent === "checkout" && meta.plan && !actions.some((a) => a.type === "checkout")) {
    actions.push({
      type: "checkout",
      plan: meta.plan,
      label: checkoutLabel(meta.plan, lang),
    });
  }
  return actions.slice(0, 5);
}

function detectIntent(text: string): Meta {
  const t = text.toLowerCase();
  let plan: PlanKey | null = null;
  if (/\b(partner|2499|2\s?499)\b/.test(t)) plan = "grow_hub_partner";
  else if (/\b(command|1249|1\s?249)\b/.test(t)) plan = "grow_hub_command";
  else if (/\b(scale|749)\b/.test(t)) plan = "grow_hub_scale";
  else if (/\b(growth|499)\b/.test(t)) plan = "grow_hub_growth";
  else if (/\b(launch|249)\b/.test(t)) plan = "grow_hub_launch";
  else if (/\b(spark|99)\b/.test(t)) plan = "grow_hub_spark";

  if (/\b(prix|price|pricing|forfait|plan|co[uû]t|cost|abonnement|subscribe|s'?abonn)/.test(t)) {
    return { intent: plan ? "checkout" : "pricing", plan, path: "/forfaits" };
  }
  if (/\b(outil|tools|arsenal|roi|comparat|master\s*tools)\b/.test(t)) {
    return { intent: "navigate", path: "/outils", plan: null };
  }
  if (/\b(diagnostic|leak|score|fuite)\b/.test(t)) {
    return { intent: "navigate", path: "/diagnostic", plan: null };
  }
  if (/\b(grow\s*hub|pipeline|crm)\b/.test(t)) {
    return { intent: "navigate", path: "/grow-hub", plan: null };
  }
  if (/\b(contact|consult|appel|call|rdv|meeting|humain|human|parler)\b/.test(t)) {
    return { intent: "consult", path: "/contact", plan: null };
  }
  if (/\b(faq|question|aide|help)\b/.test(t)) {
    return { intent: "navigate", path: "/faq", plan: null };
  }
  if (/\b(email|courriel|coordonn|callback|rappeler|leave my|laisser)\b/.test(t)) {
    return { intent: "capture_lead", path: null, plan: null };
  }
  if (/\b(service|site|seo|automat|agent ia|application)\b/.test(t)) {
    return { intent: "navigate", path: "/services", plan: null };
  }
  return { intent: "faq", plan: null, path: null };
}

function fallbackReply(userText: string, lang: ChatLang): ChatResult {
  const meta = detectIntent(userText);
  const intent = meta.intent || "faq";
  let reply: string;

  if (lang === "en") {
    if (intent === "pricing" || intent === "checkout") {
      reply = meta.plan
        ? `${PLANS[meta.plan].name} is $${PLANS[meta.plan].amountCad} CAD/month via Stripe. ${PLANS[meta.plan].blurbEn} I can open checkout or capture your details.`
        : `Grow Hub (CAD/mo): Spark $99 · Launch $249 · Growth $499 (recommended) · Scale $749 · Command $1,249 · Partner $2,499. Enterprise = consult. Want a link, Master Tools (/outils), or leave your email?`;
    } else if (intent === "navigate" && meta.path === "/outils") {
      reply =
        "Master Tools is the decision kit: Leak Score, Grow Hub preview, ROI calculator, GHL/HubSpot/agency comparer, and AI secretary prompts. Open /outils when ready.";
    } else if (intent === "navigate" && meta.path === "/diagnostic") {
      reply =
        "The Revenue Leak Score takes about 60 seconds and points you to the right Grow Hub plan. Open the diagnostic when ready — I'm here 24/7.";
    } else if (intent === "navigate" && meta.path === "/grow-hub") {
      reply =
        "Grow Hub is the interactive pipeline: stages, next actions, and a path to subscribe. I can open the preview or capture a lead for the team.";
    } else if (intent === "consult" || intent === "capture_lead") {
      reply =
        "Gladly. Share your name, email and need — I'll route it to the team. Or open the consultation page.";
    } else if (intent === "navigate" && meta.path === "/services") {
      reply =
        "We build conversion sites, web/mobile apps, AI agents and automation, plus SEO — always wired into one revenue provenance. See Services or tell me your priority.";
    } else {
      reply =
        "I'm BlackWay's AI secretary — available 24/7. Grow Hub plans $99–$2,499 CAD, Master Tools at /outils, diagnostic, or lead capture. What do you need?";
    }
  } else {
    if (intent === "pricing" || intent === "checkout") {
      reply = meta.plan
        ? `${PLANS[meta.plan].name} est à ${PLANS[meta.plan].amountCad} $ CAD/mois via Stripe. ${PLANS[meta.plan].blurbFr} Je peux ouvrir le paiement ou noter vos coordonnées.`
        : `Grow Hub (CAD/mois) : Spark 99 $ · Launch 249 $ · Growth 499 $ (recommandé) · Scale 749 $ · Command 1 249 $ · Partner 2 499 $. Entreprise = consultation. Lien, Master Tools (/outils), ou laisser un courriel ?`;
    } else if (intent === "navigate" && meta.path === "/outils") {
      reply =
        "Master Tools, c’est la trousse de décision : Leak Score, Grow Hub, calculateur ROI, comparateur GHL/HubSpot/agence, prompts secrétaire IA. Ouvrez /outils quand vous voulez.";
    } else if (intent === "navigate" && meta.path === "/diagnostic") {
      reply =
        "Le Revenue Leak Score prend environ 60 secondes et oriente vers le bon forfait Grow Hub. Ouvrez le diagnostic quand vous voulez — je reste disponible 24h/24.";
    } else if (intent === "navigate" && meta.path === "/grow-hub") {
      reply =
        "Grow Hub, c’est le pipeline interactif : étapes, prochaines actions et chemin vers l’abonnement. Je peux ouvrir l’aperçu ou transmettre un lead à l’équipe.";
    } else if (intent === "consult" || intent === "capture_lead") {
      reply =
        "Avec plaisir. Indiquez prénom, courriel et besoin — je route vers l’équipe. Ou ouvrez la page consultation.";
    } else if (intent === "navigate" && meta.path === "/services") {
      reply =
        "Sites haute conversion, apps, agents IA et automatisations, SEO — toujours reliés à une seule provenance revenu. Voir Services ou dites-moi votre priorité.";
    } else {
      reply =
        "Je suis la secrétaire IA BlackWay — disponible 24h/24. Forfaits 99–2 499 $ CAD, Master Tools (/outils), diagnostic ou prise de coordonnées. De quoi avez-vous besoin ?";
    }
  }

  return {
    reply,
    actions: actionsFromMeta(meta, lang),
    engine: "fallback",
  };
}

async function runWorkersAi(
  ai: Ai,
  messages: ChatMessage[],
  lang: ChatLang,
): Promise<{ text: string | null; error?: string }> {
  try {
    const result: unknown = await ai.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      messages: [{ role: "system", content: systemPrompt(lang) }, ...messages].map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 420,
      temperature: 0.35,
    });
    if (typeof result === "string") {
      const text = result.trim();
      return { text: text || null };
    }
    if (result && typeof result === "object") {
      const obj = result as { response?: unknown; result?: unknown };
      const candidate =
        typeof obj.response === "string"
          ? obj.response
          : typeof obj.result === "string"
            ? obj.result
            : null;
      const text = candidate?.trim() || "";
      return { text: text || null, error: text ? undefined : "empty_ai_response" };
    }
    return { text: null, error: "unexpected_ai_shape" };
  } catch (e) {
    return { text: null, error: String(e).slice(0, 240) };
  }
}

async function runOpenAi(
  apiKey: string,
  messages: ChatMessage[],
  lang: ChatLang,
): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.35,
        max_tokens: 420,
        messages: [{ role: "system", content: systemPrompt(lang) }, ...messages],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

function finalize(
  raw: string,
  lang: ChatLang,
  engine: ChatResult["engine"],
  aiError?: string,
): ChatResult {
  const { reply, meta } = parseMeta(raw);
  const detected = detectIntent(reply + " " + (meta.intent || ""));
  const merged: Meta = {
    intent: meta.intent || detected.intent,
    plan: meta.plan || detected.plan,
    path: meta.path || detected.path,
  };
  return {
    reply: reply || fallbackReply("", lang).reply,
    actions: actionsFromMeta(merged, lang),
    engine,
    ...(aiError ? { aiError } : {}),
  };
}

export async function handleChat(opts: {
  messages: ChatMessage[];
  lang: ChatLang;
  ai?: Ai;
  openaiKey?: string;
  checkout?: Partial<CheckoutLinks>;
}): Promise<ChatResult> {
  const lang = opts.lang;
  const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content || "";
  void DEFAULT_CHECKOUT;
  void opts.checkout;

  if (opts.ai) {
    const aiRes = await runWorkersAi(opts.ai, opts.messages.slice(-8), lang);
    if (aiRes.text) return finalize(aiRes.text, lang, "workers_ai");
    if (opts.openaiKey) {
      const oai = await runOpenAi(opts.openaiKey, opts.messages.slice(-8), lang);
      if (oai) return finalize(oai, lang, "openai");
    }
    const fb = fallbackReply(lastUser, lang);
    return { ...fb, aiError: aiRes.error };
  }

  if (opts.openaiKey) {
    const oai = await runOpenAi(opts.openaiKey, opts.messages.slice(-8), lang);
    if (oai) return finalize(oai, lang, "openai");
  }

  return fallbackReply(lastUser, lang);
}
