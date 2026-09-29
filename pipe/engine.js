/**
 * BlackWay autonomy tick — no ads copy, only next-action on Master CRM leads.
 * Cron + POST /ops/engine/tick. Does not send email until a mail binding exists;
 * it writes machine.script + checkout URL onto the lead.
 */

const PAYER = "https://blackwayconnect.com/payer";
const HOUR = 3600000;
const DAY = 24 * HOUR;

const LIVE_PLANS = new Set(["grow_hub_launch", "grow_hub_growth", "grow_hub_scale"]);

export function payerUrl(intent) {
  const raw = String(intent || "").trim();
  const plan = LIVE_PLANS.has(raw) ? raw : "grow_hub_growth";
  return `${PAYER}?plan=${plan}`;
}

const LIVE_SRC = new Set([
  "king_leads_page",
  "diagnostic",
  "campagne",
  "portail",
  "portal_capture",
  "portail_capture",
  "cellulaire",
  "cell_pipeline",
  "cell_checkout",
  "tool_relance_panier",
  "tool_soumission",
  "tool_checklist",
  "master_tools",
  "master_tools_roi",
  "master_tools_compare",
  "ads_growth",
  "merci_form",
  "app_mobile",
  "contact",
  "site_web",
  "leads",
]);

const BLOCK_SRC = new Set(["prospection", "reference", "hubspot", "import", "stripe"]);

export function isFirstPartySource(src) {
  return LIVE_SRC.has(String(src || "").toLowerCase().trim());
}

/** Site/Paddle/tools only — not HubSpot dumps. form_web = live only if < 48h. */
export function isEngineEligible(lead, now = Date.now()) {
  if (!lead) return false;
  if (lead.stage === "won" || lead.stage === "lost" || lead.stage === "archive") return false;
  const src = String(lead.source || "").toLowerCase().trim();
  const msg = `${lead.message || ""}`.toLowerCase();
  if (BLOCK_SRC.has(src)) return false;
  if (/hubspot import|crm import/.test(msg)) return false;
  if (LIVE_SRC.has(src)) return true;
  const created = Date.parse(lead.created_at || "") || 0;
  const age = now - created;
  if (/bw_source=(master_tools|tool_|portail|cell_|king_leads|diagnostic|ads_growth|site_web)/.test(msg)) return true;
  if ((src === "form_web" || !src) && created && age >= 0 && age < 48 * HOUR) return true;
  return false;
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildScript(lead) {
  const fr = String(lead.langue || "fr") !== "en";
  const url = payerUrl(lead.intent);
  const first = String(lead.prenom || "").trim() || (fr ? "bonjour" : "there");
  const hello = fr ? `Bonjour ${first},` : `Hi ${first},`;
  const text = fr
    ? `${hello}\n\nMerci d’avoir pris contact avec BlackWay. Quand tu es prêt, le paiement Paddle (Launch, Growth ou Scale) est ici :\n${url}\n\nDes questions ? 1-888-853-9080 · serviceclient@blackwayconnect.com\n\n— L’équipe BlackWayConnect`
    : `${hello}\n\nThanks for reaching out to BlackWay. When you’re ready, Paddle checkout (Launch, Growth or Scale) is here:\n${url}\n\nQuestions? 1-888-853-9080 · serviceclient@blackwayconnect.com\n\n— BlackWayConnect`;
  const cta = fr ? "Ouvrir le paiement Paddle" : "Open Paddle checkout";
  const blurb = fr
    ? "Merci d’avoir pris contact. Voici un bouton clair — pas de pièce jointe, pas de surprise. Paddle gère la carte."
    : "Thanks for getting in touch. One clear button — no attachment, no surprise. Paddle handles the card.";
  const html = emailShell({
    preheader: fr ? "Ton lien Paddle BlackWay, en un clic." : "Your BlackWay Paddle link, one click.",
    hello: esc(hello),
    blurb,
    url,
    cta,
    fr,
  });
  return {
    channel: lead.telephone ? "call" : "email",
    subject: fr ? `${first !== "bonjour" ? first + " — " : ""}ton lien BlackWay` : `${first !== "there" ? first + " — " : ""}your BlackWay link`,
    body: text,
    html,
  };
}

function emailShell({ preheader, hello, blurb, url, cta, fr }) {
  const safeUrl = esc(url);
  return `<!DOCTYPE html>
<html lang="${fr ? "fr" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>BlackWayConnect</title>
</head>
<body style="margin:0;padding:0;background:#111111;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
          <tr>
            <td style="background:#0a0a0a;padding:22px 28px;border-bottom:3px solid #e10600;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#e10600;">BlackWayConnect</p>
              <p style="margin:6px 0 0;font-family:Georgia,Times,serif;font-size:22px;color:#ffffff;">${fr ? "On a gardé ta place." : "We kept your spot."}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;color:#e8e8e8;font-size:16px;line-height:1.55;">
              <p style="margin:0 0 16px;color:#ffffff;font-size:18px;">${hello}</p>
              <p style="margin:0 0 24px;color:#cfcfcf;">${esc(blurb)}</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#e10600;">
                    <a href="${safeUrl}" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${esc(cta)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;font-size:13px;color:#8a8a8a;word-break:break-all;">${safeUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#888888;">
              ${fr ? "Québec · 1-888-853-9080 · serviceclient@blackwayconnect.com" : "Quebec · 1-888-853-9080 · serviceclient@blackwayconnect.com"}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Pure decision. Returns null if the lead should not move this tick.
 * @param {object} lead
 * @param {number} now
 */
export function decide(lead, now) {
  if (!isEngineEligible(lead, now)) return null;
  const slaDue = Date.parse(lead.sla_due || "") || 0;
  const updated = Date.parse(lead.updated_at || lead.created_at || "") || now;
  const lastTick = Date.parse(lead.machine?.last_tick || "") || 0;
  const quiet = now - lastTick < 12 * HOUR;
  const slaBreach = slaDue && now > slaDue && (lead.stage === "inbox" || lead.stage === "contacted");
  const needsPretty =
    !!lead.machine?.sent_at && !String(lead.machine?.script?.html || "").includes("e10600");

  if (quiet && !slaBreach && !needsPretty) return null;

  const checkout = payerUrl(lead.intent);
  const script = buildScript(lead);
  const touches = (lead.machine?.touches || 0) + 1;

  if (slaBreach) {
    return {
      stage: "leak",
      machine: {
        last_tick: new Date(now).toISOString(),
        touches,
        next_action: "relance_sla",
        checkout,
        script,
      },
    };
  }

  if (lead.stage === "inbox" && (lead.grade === "KING" || lead.grade === "SURGICAL") && now - updated > 30 * 60 * 1000) {
    return {
      stage: lead.stage,
      machine: {
        last_tick: new Date(now).toISOString(),
        touches,
        next_action: "call_now",
        checkout,
        script,
      },
    };
  }

  if (lead.stage === "qualified" && now - updated > 3 * DAY) {
    return {
      stage: lead.stage,
      machine: {
        last_tick: new Date(now).toISOString(),
        touches,
        next_action: "send_payer",
        checkout,
        script,
      },
    };
  }

  if (lead.stage === "leak" && !lead.machine?.checkout) {
    return {
      stage: "leak",
      machine: {
        last_tick: new Date(now).toISOString(),
        touches,
        next_action: "relance_leak",
        checkout,
        script,
      },
    };
  }

  if (lead.stage === "contacted" && now - updated > 2 * DAY) {
    return {
      stage: lead.stage,
      machine: {
        last_tick: new Date(now).toISOString(),
        touches,
        next_action: "followup",
        checkout,
        script,
      },
    };
  }

  if (needsPretty) {
    return {
      stage: lead.stage,
      machine: {
        last_tick: new Date(now).toISOString(),
        touches,
        next_action: "send_pretty",
        checkout,
        script,
      },
    };
  }

  return null;
}

export async function deliverActionEmail(env, lead, machine) {
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
    return { sent: false, reason: "no_email_binding" };
  }
  const to = String(lead.email || "").trim().toLowerCase();
  if (!to.includes("@") || to.endsWith("@example.com") || to.startsWith("noreply@")) {
    return { sent: false, reason: "bad_recipient" };
  }
  const script = machine.script || {};
  try {
    const payload = {
      from: { email: "serviceclient@blackwayconnect.com", name: "BlackWayConnect" },
      to,
      bcc: "serviceclient@blackwayconnect.com",
      subject: String(script.subject || "BlackWayConnect").slice(0, 200),
      text: String(script.body || "").slice(0, 8000),
    };
    if (script.html) payload.html = String(script.html).slice(0, 20000);
    await env.EMAIL.send(payload);
    return { sent: true, reason: "ok" };
  } catch (e) {
    return { sent: false, reason: String(e).slice(0, 240) };
  }
}

export async function deliverOpsDigest(env, summary) {
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") return;
  if (!summary.acted && !summary.parked) return;
  const lines = (summary.actions || [])
    .map((a) => `${a.next_action} | ${a.entreprise || ""} | ${a.email} | ${a.checkout || ""}`)
    .join("\n");
  try {
    await env.EMAIL.send({
      from: { email: "serviceclient@blackwayconnect.com", name: "BlackWay Engine" },
      to: "serviceclient@blackwayconnect.com",
      subject: `Engine act=${summary.acted} park=${summary.parked || 0} scan=${summary.scanned} ${summary.at}`,
      text: lines || "tick vide",
      html: `<pre style="font-family:Georgia,serif;font-size:14px;color:#111;white-space:pre-wrap;">${esc(lines || "tick vide")}</pre>`,
    });
  } catch (e) {
    console.log("engine digest", e);
  }
}
