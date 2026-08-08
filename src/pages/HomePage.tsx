import { Link } from "react-router-dom";
import { Hero } from "../Hero";
import { ContactForm } from "../ContactForm";
import { AppCta } from "../AppCta";
import { useLang } from "../i18n";
import { checkoutUrl } from "../stripeConfig";

export function HomePage() {
  const { t, path, lang } = useLang();

  return (
    <>
      <Hero />

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
          <div className="cta-row" style={{ marginTop: "1.75rem" }}>
            <Link className="btn btn--primary" to={path("/forfaits-growth")}>
              {lang === "fr" ? "Commencer avec Growth — 499 $/mois" : "Start with Growth — $499/mo"}
            </Link>
            <Link className="btn btn--ghost" to={path("/forfaits")}>
              {t.ctaPricing}
            </Link>
            <Link className="btn btn--ghost" to={path("/grow-hub")}>
              {t.ctaGrow}
            </Link>
          </div>
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
                <a
                  className="btn btn--primary plan-item__cta"
                  href={checkoutUrl(plan.key, { lang, source: "site_web", content: "home_plans" })}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t.ctaBuy}
                </a>
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
            <p style={{ marginTop: "0.85rem" }}>{t.marketBody}</p>
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
          <div className="cta-row" style={{ marginTop: "1.75rem" }}>
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
                <a
                  key={plan.key}
                  className="contact-aside__plan"
                  href={checkoutUrl(plan.key, { lang, source: "site_web", content: "home_contact_aside" })}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>{plan.name}</span>
                  <strong>{plan.price}</strong>
                  <span className="contact-aside__cta">{t.ctaBuy}</span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
