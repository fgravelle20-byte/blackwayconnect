import { Link } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { initializePublicHomePaddle } from "../paddleLoader";
import { Hero } from "../Hero";
import { ContactForm } from "../ContactForm";
import { AppCta } from "../AppCta";
import { useLang } from "../i18n";
import { checkoutUrl } from "../stripeConfig";
import { isPaddlePlanKey } from "../paddleCatalog";

function sameSitePath(href: string): string | null {
  try {
    const url = new URL(href, "https://blackwayconnect.com");
    if (url.origin !== "https://blackwayconnect.com") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function PlanLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const local = sameSitePath(href);
  if (local) {
    return (
      <Link className={className} to={local}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

export function HomePage() {
  const { t, path, lang } = useLang();

  useEffect(() => {
    // Retain still runs on the public home page, after the first paint.
    // The client-side token is browser-public; never put an API key here.
    const start = () => {
      void initializePublicHomePaddle().catch((error) => {
        console.warn("Paddle.js unavailable on home page", error);
      });
    };
    const id = window.requestIdleCallback(start, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }, []);

  return (
    <>
      <Hero />

      <section className="section ops-strip" aria-label={lang === "fr" ? "Systèmes en ligne" : "Live systems"}>
        <div className="shell ops-strip__row">
          <Link to={path("/diagnostic")}>{lang === "fr" ? "Score de fuites" : "Leak score"}</Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("bw-open-secretary"))}
          >
            {lang === "fr" ? "Secrétaire IA" : "AI secretary"}
          </button>
          <Link to={path("/outils")}>{lang === "fr" ? "Outils" : "Tools"}</Link>
          <Link to={path("/forfaits")}>{lang === "fr" ? "Paiement" : "Checkout"}</Link>
          <Link to={path("/portail")}>{lang === "fr" ? "Portail" : "Portal"}</Link>
        </div>
      </section>

      <section className="section" id="grow">
        <div className="shell">
          <div className="section__head">
            <h2>{t.growTitle}</h2>
            <p>{t.growBody}</p>
          </div>
          <ul className="point-list">
            {t.growPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="plans">
        <div className="shell">
          <div className="section__head">
            <h2>{t.plansTitle}</h2>
            <p>{t.plansBody}</p>
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
                <h3>{plan.name}</h3>
                <p className="price">{plan.price}</p>
                <p className="plan-item__blurb">{plan.blurb}</p>
                <PlanLink
                  className="btn btn--primary plan-item__cta"
                  href={checkoutUrl(plan.key, { lang, source: "site_web", content: "home_plans" })}
                >
                  {isPaddlePlanKey(plan.key)
                    ? t.ctaBuy
                    : lang === "fr"
                      ? "Demander une offre"
                      : "Request an offer"}
                </PlanLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="proof">
        <div className="shell">
          <div className="section__head">
            <h2>{t.proofTitle}</h2>
            <p>{t.proofBody}</p>
          </div>
          <ul className="point-list">
            {t.proofItems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="services">
        <div className="shell">
          <div className="section__head">
            <h2>{t.servicesTitle}</h2>
            <p>{t.servicesBody}</p>
          </div>
          <div className="service-rail">
            {t.services.map((s, i) => (
              <article className="service-item" key={s.title}>
                <span className="service-item__num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="market">
            <h2>{t.marketTitle}</h2>
            <p>{t.marketBody}</p>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="shell">
          <div className="section__head">
            <h2>{t.faqTitle}</h2>
            <p>{t.faqBody}</p>
          </div>
          <div className="faq-list">
            {t.faq.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="cta-row">
            <Link className="btn btn--primary" to={path("/faq")}>
              {t.nav.faq}
            </Link>
            <Link className="btn btn--ghost" to={path("/forfaits")}>
              {t.ctaPricing}
            </Link>
            <Link className="btn btn--ghost" to={path("/contact")}>
              {t.ctaConsult}
            </Link>
          </div>
        </div>
      </section>

      <AppCta />

      <section className="section section--contact" id="contact">
        <div className="shell contact-split">
          <div>
            <div className="section__head">
              <h2>{t.consultTitle}</h2>
              <p>{t.consultBody}</p>
            </div>
            <ContactForm />
          </div>
          <aside className="contact-aside" aria-label={t.contactAside}>
            <h3>{t.contactAside}</h3>
            <p>{t.contactFast}</p>
            <div className="contact-aside__plans">
              {t.plans.map((plan) => (
                <PlanLink
                  key={plan.key}
                  className="contact-aside__plan"
                  href={checkoutUrl(plan.key, { lang, source: "site_web", content: "home_contact_aside" })}
                >
                  <span>{plan.name}</span>
                  <strong>{plan.price}</strong>
                  <span className="contact-aside__cta">
                    {isPaddlePlanKey(plan.key)
                      ? t.ctaBuy
                      : lang === "fr"
                        ? "Demander une offre"
                        : "Request an offer"}
                  </span>
                </PlanLink>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
