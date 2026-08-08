import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useLang } from "../i18n";
import { ContactForm } from "../ContactForm";
import { ContactDetails } from "../ContactDetails";
import { ConvertStickyBar } from "../ConvertStickyBar";
import { APP_QR_PATH } from "../appConfig";
import { checkoutUrl, PLANS, type PlanKey } from "../stripeConfig";
import { GrowHubPreview } from "../GrowHubPreview";
import { PhotoFigure } from "../PhotoFigure";
import { ShareBar } from "../ShareBar";
import { trackInitiateCheckout, trackPurchase } from "../tracking";
import { PHONES } from "../siteContact";

const PLAN_LABELS: Record<PlanKey, { fr: string; en: string }> = {
  grow_hub_spark: { fr: "Grow Hub Spark", en: "Grow Hub Spark" },
  grow_hub_launch: { fr: "Grow Hub Launch", en: "Grow Hub Launch" },
  grow_hub_growth: { fr: "Grow Hub Growth", en: "Grow Hub Growth" },
  grow_hub_scale: { fr: "Grow Hub Scale", en: "Grow Hub Scale" },
  grow_hub_command: { fr: "Grow Hub Command", en: "Grow Hub Command" },
  grow_hub_partner: { fr: "Grow Hub Partner", en: "Grow Hub Partner" },
};

function resolvePlanKey(raw: string | null): PlanKey | null {
  if (!raw) return null;
  return (raw in PLANS ? raw : null) as PlanKey | null;
}

export function GrowHubPage() {
  return (
    <section className="section section--ghp section--page">
      <div className="shell shell--wide">
        <GrowHubPreview />
        <ShareBar variant="grow-hub" className="share-bar--panel" />
      </div>
    </section>
  );
}

export function ServicesPage() {
  const { t } = useLang();
  return (
    <section className="section section--page">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{t.nav.services}</p>
          <h1 className="display page-hero__title">{t.servicesTitle}</h1>
          <p className="lede">{t.servicesBody}</p>
        </div>
        <div className="service-rail">
          {t.services.map((s, i) => (
            <article className="service-item" key={s.title}>
              <span className="service-item__num">0{i + 1}</span>
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingPage() {
  const { t, path, lang } = useLang();
  const fr = lang === "fr";
  const growthHref = checkoutUrl("grow_hub_growth", {
    lang,
    source: "site_web",
    content: "pricing_sticky_growth",
  });
  return (
    <>
      <section className="section section--page section--with-convert-bar">
        <div className="shell">
          <div className="page-hero">
            <p className="eyebrow">{fr ? "Revenu #1 · Grow Hub Web" : "Revenue #1 · Grow Hub Web"}</p>
            <h1 className="display page-hero__title">
              {fr ? "Choisis. Abonne. Portail ouvert." : "Pick. Subscribe. Portal opens."}
            </h1>
            <p className="lede">
              {fr
                ? "Spark → Partner. La plupart des PME partent sur Growth (499 $/mois) — score, relances, Portail + mobile inclus. Stripe. Annulable."
                : "Spark → Partner. Most SMBs start on Growth ($499/mo) — scoring, follow-ups, Portal + mobile included. Stripe. Cancel anytime."}
            </p>
            <div className="cta-row" style={{ marginTop: "1.25rem" }}>
              <a
                className="btn btn--primary"
                href={growthHref}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() =>
                  trackInitiateCheckout({ plan: "grow_hub_growth", value: PLANS.grow_hub_growth.amountCad })
                }
              >
                {fr ? "Essayer Growth — 499 $/mois" : "Try Growth — $499/mo"}
              </a>
              <a className="btn btn--ghost" href={PHONES.tollFree.href}>
                {fr ? `Appeler ${PHONES.tollFree.display}` : `Call ${PHONES.tollFree.display}`}
              </a>
              <Link className="btn btn--ghost" to={path("/forfaits-growth")}>
                {fr ? "Page offre Growth" : "Growth offer page"}
              </Link>
            </div>
            <p className="lede" style={{ marginTop: "0.75rem" }}>
              {fr
                ? "Inclus avec chaque forfait : Portail Client Master + accès mobile."
                : "Included with every plan: Client Master Portal + mobile access."}
            </p>
            <p className="lede" style={{ marginTop: "0.75rem" }}>
              <Link className="btn btn--ghost" to={path("/forfaits-cellulaire")}>
                {fr
                  ? "Optionnel : Pack Cellulaire / Terrain (revenu #2) →"
                  : "Optional: Cellular / Field Pack (revenue #2) →"}
              </Link>
            </p>
          </div>
          <div className="plan-rail">
            {t.plans.map((plan) => (
              <article
                className={`plan-item${plan.key === "grow_hub_growth" ? " plan-item--featured" : ""}`}
                key={plan.key}
              >
                {plan.key === "grow_hub_growth" ? (
                  <span className="plan-item__badge">{lang === "fr" ? "Recommandé" : "Recommended"}</span>
                ) : null}
                <h2>{plan.name}</h2>
                <p className="price">{plan.price}</p>
                <p className="plan-item__blurb">{plan.blurb}</p>
                <a
                  className="btn btn--primary plan-item__cta"
                  href={checkoutUrl(plan.key, { lang, source: "site_web", content: "pricing_page" })}
                  rel="noopener noreferrer"
                  target="_blank"
                  onClick={() =>
                    trackInitiateCheckout({
                      plan: plan.key,
                      value: PLANS[plan.key as PlanKey]?.amountCad || 0,
                    })
                  }
                >
                  {t.ctaBuy}
                </a>
              </article>
            ))}
          </div>
          <div className="cta-row" style={{ marginTop: "2.25rem" }}>
            <a
              className="btn btn--primary"
              href={checkoutUrl("grow_hub_growth", { lang, source: "site_web", content: "pricing_footer_growth" })}
              rel="noopener noreferrer"
              target="_blank"
              onClick={() =>
                trackInitiateCheckout({ plan: "grow_hub_growth", value: PLANS.grow_hub_growth.amountCad })
              }
            >
              {lang === "fr" ? "S’abonner Growth — 499 $/mois" : "Subscribe Growth — $499/mo"}
            </a>
            <Link className="btn btn--ghost" to={path("/diagnostic")}>
              {fr ? "Leak Score 60 s" : "60s Leak Score"}
            </Link>
            <Link className="btn btn--ghost" to={path("/contact")}>
              {t.ctaConsult}
            </Link>
          </div>
          <ShareBar variant="forfaits" className="share-bar--panel" />
        </div>
      </section>
      <ConvertStickyBar
        primaryHref={growthHref}
        primaryLabel={fr ? "Acheter Growth — 499 $" : "Buy Growth — $499"}
        external
        onPrimaryClick={() =>
          trackInitiateCheckout({ plan: "grow_hub_growth", value: PLANS.grow_hub_growth.amountCad })
        }
      />
    </>
  );
}

export function TeamPage() {
  const { t, path } = useLang();
  return (
    <section className="section section--page">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{t.nav.team}</p>
          <h1 className="display page-hero__title">{t.teamTitle}</h1>
          <p className="lede">{t.teamBody}</p>
        </div>
        <div className="team-visual">
          <img src="/office-team.jpg" alt={t.teamTitle} width={1600} height={900} decoding="async" />
          <p className="team-visual__cap">{t.office.body}</p>
        </div>
        <div className="photo-rail photo-rail--team">
          {t.teamGallery
            .filter((g) => g.src !== "/office-team.jpg")
            .map((item) => (
              <PhotoFigure
                key={item.src + item.title}
                src={item.src}
                title={item.title}
                body={item.body}
                optional={item.optional}
              />
            ))}
        </div>
        <div className="cta-row" style={{ marginTop: "2rem" }}>
          <Link className="btn btn--primary" to={path("/qui-sommes-nous")}>
            {t.nav.mission}
          </Link>
          <Link className="btn btn--ghost" to={path("/contact")}>
            {t.ctaConsult}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MissionPage() {
  const { t, path } = useLang();
  const m = t.mission;
  return (
    <section className="section section--page section--mission">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{m.eyebrow}</p>
          <h1 className="display page-hero__title">{m.title}</h1>
          <p className="lede">{m.body}</p>
        </div>
      </div>
      <div className="mission-hero">
        <img src={m.heroSrc} alt={m.heroTitle} width={1400} height={1800} decoding="async" />
        <div className="shell mission-hero__cap">
          <strong>{m.heroTitle}</strong>
          <p>{m.heroBody}</p>
        </div>
      </div>
      <div className="shell">
        <div className="mission-vision">
          <h2>{m.visionTitle}</h2>
          <p>{m.visionBody}</p>
        </div>
        <div className="section__head" style={{ marginTop: "2.5rem" }}>
          <h2>{m.valuesTitle}</h2>
        </div>
        <div className="mission-values">
          {m.values.map((v) => (
            <article className="mission-value" key={v.title}>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </article>
          ))}
        </div>
        <div className="photo-rail photo-rail--mission">
          {m.photos.map((item) => (
            <PhotoFigure
              key={item.src + item.title}
              src={item.src}
              title={item.title}
              body={item.body}
              optional={item.optional}
            />
          ))}
        </div>
        <div className="cta-row" style={{ marginTop: "2rem" }}>
          <Link className="btn btn--primary" to={path("/contact")}>
            {t.ctaConsult}
          </Link>
          <Link className="btn btn--ghost" to={path("/equipe")}>
            {t.nav.team}
          </Link>
          <Link className="btn btn--ghost" to={path("/forfaits")}>
            {t.ctaPricing}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FaqPage() {
  const { t, path } = useLang();
  return (
    <section className="section section--page">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{t.nav.faq}</p>
          <h1 className="display page-hero__title">{t.faqTitle}</h1>
          <p className="lede">{t.faqBody}</p>
        </div>
        <div className="faq-list faq-list--page">
          {t.faq.map((item) => (
            <details className="faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <div className="cta-row" style={{ marginTop: "2rem" }}>
          <Link className="btn btn--primary" to={path("/contact")}>
            {t.ctaConsult}
          </Link>
          <Link className="btn btn--ghost" to={path("/forfaits")}>
            {t.ctaPricing}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ContactPage() {
  const { t, lang } = useLang();
  return (
    <section className="section section--page section--contact">
      <div className="shell contact-split">
        <div>
          <div className="page-hero">
            <p className="eyebrow">{t.nav.contact}</p>
            <h1 className="display page-hero__title">{t.consultTitle}</h1>
            <p className="lede">{t.consultBody}</p>
          </div>
          <ContactForm />
        </div>
        <aside className="contact-aside" aria-label={t.contactAside}>
          <h3>{t.contactAside}</h3>
          <p>{t.contactFast}</p>
          <div className="contact-aside__plans">
            {t.plans.map((plan) => (
              <a
                key={plan.key}
                className="contact-aside__plan"
                href={checkoutUrl(plan.key, { lang, source: "site_web", content: "contact_page" })}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>{plan.name}</span>
                <strong>{plan.price}</strong>
                <span className="contact-aside__cta">{t.ctaBuy}</span>
              </a>
            ))}
          </div>
          <div className="contact-aside__office">
            <ContactDetails showMap />
          </div>
        </aside>
      </div>
    </section>
  );
}

export function MerciPage() {
  const { lang, path, t } = useLang();
  const [params] = useSearchParams();
  const fr = lang === "fr";
  const src = (params.get("src") || "").toLowerCase();
  const paid = src === "stripe";
  const planKey = resolvePlanKey(params.get("plan"));
  const planMeta = planKey ? PLAN_LABELS[planKey] : null;
  const planCopy = planKey ? t.plans.find((p) => p.key === planKey) : null;
  const planName = planMeta ? (fr ? planMeta.fr : planMeta.en) : null;
  const amount = planKey ? PLANS[planKey].amountCad : null;

  useEffect(() => {
    if (!paid) return;
    trackPurchase({ plan: planKey || undefined, value: amount || undefined });
  }, [paid, planKey, amount]);

  const steps = paid
    ? fr
      ? [
          {
            n: "01",
            title: "Paiement confirmé",
            body: "Stripe a encaissé. Vous êtes client actif — pas besoin de renvoyer vos infos.",
          },
          {
            n: "02",
            title: "CRM mis à jour",
            body: "Contact HubSpot en customer + deal « Paiement reçu ». Onboarding déjà dans le pipeline.",
          },
          {
            n: "03",
            title: "Semaine 1 — activation",
            body: "Accès Grow Hub, cadrage pipeline et première configuration. On vous contacte sous 24–48 h ouvrables.",
          },
          {
            n: "04",
            title: "Accès inclus",
            body: "Site, Master Tools, Portail Client Master + dashboard mobile (surplus inclus). Pack Cellulaire = optionnel.",
          },
        ]
      : [
          {
            n: "01",
            title: "Payment confirmed",
            body: "Stripe collected. You’re an active client — no need to resubmit your details.",
          },
          {
            n: "02",
            title: "CRM updated",
            body: "HubSpot contact set to customer + deal at “Payment received”. Onboarding is already in the pipeline.",
          },
          {
            n: "03",
            title: "Week 1 — activation",
            body: "Grow Hub access, pipeline framing and first setup. We reach out within 24–48 business hours.",
          },
          {
            n: "04",
            title: "Access included",
            body: "Site, Master Tools, Client Master Portal + mobile dashboard (included surplus). Cellular Pack = optional.",
          },
        ]
    : fr
      ? [
          {
            n: "01",
            title: "Demande reçue",
            body: "Votre message est dans HubSpot (nouvelle opportunité). Aucune relance manuelle de votre côté.",
          },
          {
            n: "02",
            title: "Qualification",
            body: "On lit le contexte et on propose le forfait ou le prochain test adapté.",
          },
          {
            n: "03",
            title: "Prochaine action",
            body: "Réponse sous peu — ou passez directement au checkout si vous êtes prêt.",
          },
        ]
      : [
          {
            n: "01",
            title: "Request received",
            body: "Your message is in HubSpot (new opportunity). Nothing for you to chase manually.",
          },
          {
            n: "02",
            title: "Qualification",
            body: "We review context and propose the right plan or next test.",
          },
          {
            n: "03",
            title: "Next action",
            body: "We’ll reply shortly — or go straight to checkout if you’re ready.",
          },
        ];

  return (
    <section className="section section--page section--merci">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">
            {paid
              ? fr
                ? "Client actif"
                : "Active client"
              : fr
                ? "Merci"
                : "Thank you"}
          </p>
          <h1 className="display page-hero__title">
            {paid
              ? fr
                ? "Transaction complète. Vous êtes client."
                : "Transaction complete. You’re a client."
              : fr
                ? "C’est reçu. On s’occupe de la suite."
                : "Got it. We’ll take it from here."}
          </h1>
          <p className="lede">
            {paid
              ? fr
                ? `Paiement Stripe confirmé${planName ? ` — ${planName}` : ""}${amount != null ? ` (${amount} $ CAD / mois)` : ""}. Deal HubSpot créé automatiquement. Voici vos prochaines étapes — rien à gérer manuellement de votre côté.`
                : `Stripe payment confirmed${planName ? ` — ${planName}` : ""}${amount != null ? ` ($${amount} CAD / month)` : ""}. HubSpot deal created automatically. Here’s what happens next — nothing for you to chase.`
              : fr
                ? "Votre demande est dans le pipeline HubSpot. On vous contacte sous peu — ou choisissez un forfait pour activer tout de suite."
                : "Your request is in the HubSpot pipeline. We’ll reach out shortly — or pick a plan to activate now."}
          </p>
          {paid && planCopy ? <p className="merci-plan-blurb">{planCopy.blurb}</p> : null}
        </div>

        <ol className="merci-steps" aria-label={fr ? "Prochaines étapes" : "Next steps"}>
          {steps.map((s) => (
            <li className="merci-step" key={s.n}>
              <span className="merci-step__num">{s.n}</span>
              <div>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="merci-panel">
          <div className="merci-panel__copy">
            <h2>{fr ? "Ressources client" : "Client resources"}</h2>
            <p>
              {fr
                ? "Gardez ces liens. Le CRM vous a déjà — pas besoin de rappeler pour « s’assurer que c’est rentré »."
                : "Keep these links. CRM already has you — no need to call to “make sure it landed.”"}
            </p>
            <div className="cta-row">
              {paid ? (
                <Link
                  className="btn btn--primary"
                  to={`${path("/portail")}${planKey ? `?plan=${encodeURIComponent(planKey)}` : ""}`}
                >
                  {fr ? "Ouvrir le Portail Client Master" : "Open Client Master Portal"}
                </Link>
              ) : (
                <Link className="btn btn--primary" to={path("/forfaits")}>
                  {fr ? "Voir les forfaits" : "See plans"}
                </Link>
              )}
              {paid ? (
                <Link className="btn btn--ghost" to={path("/portail")}>
                  {fr ? "Dashboard mobile (inclus)" : "Mobile dashboard (included)"}
                </Link>
              ) : null}
              {paid ? (
                <Link className="btn btn--ghost" to={path("/forfaits-cellulaire")}>
                  {fr ? "Pack Cellulaire (optionnel)" : "Cellular Pack (optional)"}
                </Link>
              ) : null}
              <Link className="btn btn--ghost" to={path("/grow-hub")}>
                {fr ? "Aperçu Grow Hub (site)" : "Grow Hub preview (site)"}
              </Link>
              <Link className="btn btn--ghost" to={path("/outils")}>
                {fr ? "Master Tools" : "Master Tools"}
              </Link>
              <a className="btn btn--ghost" href="mailto:serviceclient@blackwayconnect.com">
                serviceclient@blackwayconnect.com
              </a>
            </div>
            {!paid ? (
              <div className="cta-row merci-panel__buy">
                <Link className="btn btn--primary" to={path("/forfaits")}>
                  {fr ? "Voir les forfaits" : "View plans"}
                </Link>
                <a
                  className="btn btn--ghost"
                  href={checkoutUrl("grow_hub_growth", { source: "merci_form", lang })}
                >
                  {fr ? "Activer Growth maintenant" : "Activate Growth now"}
                </a>
              </div>
            ) : null}
          </div>
          <figure className="merci-qr">
            <img src={APP_QR_PATH} width={160} height={160} alt={fr ? "QR Grow Hub app" : "Grow Hub app QR"} />
            <figcaption>
              {fr
                ? "Scanner → Portail Master (dashboard mobile inclus)"
                : "Scan → Master Portal (mobile dashboard included)"}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function PrivacyPage() {
  const { t } = useLang();
  return (
    <div className="shell legal">
      <h1>{t.privacy}</h1>
      <p>{t.privacyBody}</p>
    </div>
  );
}

export function TermsPage() {
  const { t } = useLang();
  return (
    <div className="shell legal">
      <h1>{t.terms}</h1>
      <p>{t.termsBody}</p>
    </div>
  );
}
