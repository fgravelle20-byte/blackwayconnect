/** HTML + texte pour relances du CLIENT (leur marque, leur lien de paiement). */

export function escHtml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** http(s) only; anything else (Interac instructions, invoice number…) is shown as plain text, never as a link. */
export function httpUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export type FollowupMail = {
  fr: boolean;
  vendorName: string;
  vendorCompany: string;
  vendorPhone: string;
  vendorEmail?: string;
  buyerName: string;
  amountCad: number;
  payUrl: string;
};

function signature(p: FollowupMail, shop: string) {
  return [p.vendorName.trim(), shop, p.vendorPhone.trim(), (p.vendorEmail || "").trim()].filter(Boolean);
}

export function followupSubject(p: FollowupMail) {
  const first = p.buyerName.trim().split(/\s+/)[0] || "";
  const shop = p.vendorCompany.trim();
  if (p.fr) return `${first ? `${first}, o` : "O"}n a conservé votre place${shop ? ` — ${shop}` : ""}`;
  return `${first ? `${first}, w` : "W"}e kept your spot${shop ? ` — ${shop}` : ""}`;
}

export function followupText(p: FollowupMail) {
  const who = p.buyerName.trim() || (p.fr ? "bonjour" : "there");
  const shop = p.vendorCompany.trim() || (p.fr ? "notre équipe" : "our team");
  const amt = p.amountCad.toLocaleString(p.fr ? "fr-CA" : "en-CA");
  const pay = p.payUrl.trim() || (p.fr ? "(ajoutez votre lien de paiement)" : "(add your payment link)");
  const sign = signature(p, shop).join(" · ");
  if (p.fr) {
    return `Bonjour ${who},\n\nOn a conservé votre place. Le montant en attente est ${amt} $ CAD.\n\nPayer / confirmer : ${pay}\n\nDes questions ? Répondez à ce courriel.\n\n— ${sign || shop}`;
  }
  return `Hi ${who},\n\nWe kept your spot. The amount waiting is $${amt} CAD.\n\nPay / confirm: ${pay}\n\nQuestions? Just reply.\n\n— ${sign || shop}`;
}

export function followupHtml(p: FollowupMail) {
  const fr = p.fr;
  const hello = fr
    ? `Bonjour ${escHtml(p.buyerName.trim() || "bonjour")},`
    : `Hi ${escHtml(p.buyerName.trim() || "there")},`;
  const shop = escHtml(p.vendorCompany.trim() || (fr ? "Votre entreprise" : "Your company"));
  const amt = p.amountCad.toLocaleString(fr ? "fr-CA" : "en-CA");
  const pay = p.payUrl.trim();
  const link = httpUrl(pay);
  const cta = fr ? "Ouvrir le paiement" : "Open payment";
  const blurb = fr
    ? `On a conservé votre place. Montant en attente : <strong style="color:#fff;">${amt} $ CAD</strong>. Un clic — pas de pièce jointe.`
    : `We kept your spot. Amount waiting: <strong style="color:#fff;">$${amt} CAD</strong>. One click — no attachment.`;
  const btn = link
    ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#e10600;"><a href="${escHtml(link)}" style="display:inline-block;padding:14px 22px;font-family:Geist Mono,monospace;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${cta}</a></td></tr></table>
       <p style="margin:22px 0 0;font-size:13px;color:#8a8a8a;word-break:break-all;">${escHtml(link)}</p>`
    : pay
      ? `<p style="margin:0;padding:14px 16px;border-left:3px solid #e10600;background:#111111;color:#ffffff;"><strong>${fr ? "Pour payer :" : "To pay:"}</strong> ${escHtml(pay)}</p>`
      : `<p style="margin:0;color:#e10600;font-size:14px;">${fr ? "Ajoutez votre lien de paiement (Interac, facture, Paddle…)." : "Add your payment link (e-transfer, invoice, Paddle…)."}</p>`;
  const footer = signature(p, p.vendorCompany.trim() || (fr ? "Votre entreprise" : "Your company"))
    .map(escHtml)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="${fr ? "fr" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#111111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr>
          <td style="background:#0a0a0a;padding:22px 28px;border-bottom:3px solid #e10600;">
            <p style="margin:0;font-family:Geist Mono,monospace;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#e10600;">${shop}</p>
            <p style="margin:6px 0 0;font-family:Outfit,sans-serif;font-size:22px;color:#ffffff;">${fr ? "Nous avons conservé votre place." : "We kept your spot."}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;font-family:Geist Mono,monospace;color:#e8e8e8;font-size:16px;line-height:1.55;">
            <p style="margin:0 0 16px;color:#ffffff;font-size:18px;">${hello}</p>
            <p style="margin:0 0 24px;color:#cfcfcf;">${blurb}</p>
            ${btn}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px;border-top:1px solid #2a2a2a;font-family:Geist Mono,monospace;font-size:12px;color:#888888;">
            ${footer}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function copyHtmlAndText(html: string, text: string) {
  try {
    if (typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {
    /* fall through */
  }
  return copyText(text);
}

/** Clipboard API, then a hidden-textarea fallback for browsers that refuse it (unfocused doc, older Safari). */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
