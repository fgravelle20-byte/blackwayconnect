import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLang } from "./i18n";
import { scoreCopy } from "./scoreCopy";
import { AiSecretary } from "./AiSecretary";
import { EMAILS, MAPS_SEARCH_URL, PHONES, SOCIAL } from "./siteContact";

function isAppEmbed(search: string): boolean {
  const query = new URLSearchParams(search);
  if (query.get("embed") === "1") return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function FooterSocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a className="site-footer__social-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {children}
    </a>
  );
}

export function Layout() {
  const { t, lang, path } = useLang();
  const sc = scoreCopy[lang];
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const embed = useMemo(() => isAppEmbed(location.search), [location.search]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.body.classList.toggle("is-embed", embed);
    return () => document.body.classList.remove("is-embed");
  }, [embed]);

  useEffect(() => {
    setMenuOpen(false);
    const hash = location.hash?.replace(/^#/, "");
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo(0, 0);
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function toggleLang() {
    const next = lang === "fr" ? "en" : "fr";
    let p = location.pathname;
    // Keep how-it-works / comment-ca-marche paired across locales.
    if (next === "en") {
      p = p.replace(/\/comment-ca-marche\/?$/, "/how-it-works");
      navigate(p === "/" ? "/en" : `/en${p}`);
    } else {
      p = p.replace(/^\/en/, "") || "/";
      p = p.replace(/\/how-it-works\/?$/, "/comment-ca-marche");
      navigate(p);
    }
  }

  const howPath = path(lang === "en" ? "/how-it-works" : "/comment-ca-marche");

  // Same visual weight for every desktop item — no oversized CTA pills.
  const desktopNav = (
    <>
      <NavLink to={path("/forfaits")}>{t.nav.pricing}</NavLink>
      <NavLink to={howPath}>{t.nav.how}</NavLink>
      <NavLink to={path("/portail")}>{t.nav.portal}</NavLink>
      <NavLink to={path("/outils")}>{t.nav.tools}</NavLink>
      <NavLink to={path("/diagnostic")}>{sc.nav}</NavLink>
      <NavLink to={path("/contact")}>{t.nav.contact}</NavLink>
    </>
  );

  const mobileNav = (
    <>
      <NavLink to={path("/forfaits")}>{t.nav.pricing}</NavLink>
      <NavLink to={howPath}>{t.nav.how}</NavLink>
      <NavLink to={path("/portail")}>{t.nav.portal}</NavLink>
      <NavLink to={path("/contact")}>{t.nav.contact}</NavLink>
      <NavLink to={path("/outils")}>{t.nav.tools}</NavLink>
      <NavLink to={path("/diagnostic")}>{sc.nav}</NavLink>
      <NavLink to={path("/services")}>{t.nav.services}</NavLink>
      <NavLink to={path("/grow-hub")}>{t.nav.grow}</NavLink>
      <NavLink to={path("/forfaits-cellulaire")}>{t.nav.cellulaire}</NavLink>
      <NavLink to={path("/modules-ia")}>{t.nav.modulesIa}</NavLink>
      <NavLink to={path("/qui-sommes-nous")}>{t.nav.mission}</NavLink>
      <NavLink to={path("/faq")}>{t.nav.faq}</NavLink>
    </>
  );

  return (
    <>
      {embed ? null : (
      <header className="site-header">
        <div className="contact-bar">
          <div className="shell contact-bar__inner">
            <span>{lang === "fr" ? "Parler à BlackWay" : "Talk to BlackWay"}</span>
            <a href={PHONES.tollFree.href} aria-label={`${lang === "fr" ? "Appeler" : "Call"} ${PHONES.tollFree.display}`}>
              {PHONES.tollFree.display}
            </a>
            <a href={`mailto:${EMAILS.service}`}>{EMAILS.service}</a>
          </div>
        </div>
        <div className="shell site-header__inner">
          <Link to={path("/")} className="brand" aria-label={`${t.brand} home`}>
            <img
              className="brand__logo"
              src="/brand/bwc-logo-480.png"
              srcSet="/brand/bwc-logo-480.png 480w, /brand/bwc-logo-960.png 960w"
              sizes="160px"
              width={480}
              height={215}
              alt={t.brand}
              decoding="async"
              fetchPriority="high"
            />
            <span className="brand__text">
              <span className="brand__name">{t.brand}</span>
              <span className="brand__tag" title={t.tagline}>
                {t.tagline}
              </span>
            </span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {desktopNav}
          </nav>
          <div className="header-actions">
            <button type="button" className="lang-toggle" onClick={toggleLang} aria-label="Language">
              {lang === "fr" ? "EN" : "FR"}
            </button>
            <button
              type="button"
              className={`menu-toggle${menuOpen ? " is-open" : ""}`}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
        <div
          id="mobile-nav"
          className={`mobile-nav${menuOpen ? " is-open" : ""}`}
          hidden={!menuOpen}
        >
          <nav aria-label="Mobile">{mobileNav}</nav>
          <div className="mobile-nav__actions">
            <Link className="btn btn--primary" to={path("/forfaits")}>
              {t.ctaPricing}
            </Link>
            <Link className="btn btn--ghost" to={path("/contact")}>
              {t.ctaConsult}
            </Link>
          </div>
          <div className="mobile-nav__contact">
            <a href={PHONES.tollFree.href}>{PHONES.tollFree.display}</a>
            <a href={`mailto:${EMAILS.service}`}>{EMAILS.service}</a>
          </div>
        </div>
      </header>
      )}
      <main>
        <Outlet />
      </main>
      {embed ? null : (
      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <div className="site-footer__grid">
            <div className="site-footer__col">
              <img
                className="site-footer__logo"
                src="/brand/bwc-logo-480.png"
                srcSet="/brand/bwc-logo-480.png 480w, /brand/bwc-logo-960.png 960w"
                sizes="168px"
                width={480}
                height={215}
                alt={t.brand}
                loading="lazy"
                decoding="async"
              />
              <p className="site-footer__blurb">{t.footer}</p>
              <nav className="site-footer__links" aria-label={lang === "fr" ? "Portail" : "Portal"}>
                <Link to={path("/portail")}>{t.ctaApp}</Link>
              </nav>
            </div>

            <div className="site-footer__col">
              <p className="site-footer__label">{lang === "fr" ? "Produit" : "Product"}</p>
              <nav className="site-footer__links" aria-label={lang === "fr" ? "Produit" : "Product"}>
                <Link to={path("/forfaits")}>{t.nav.pricing}</Link>
                <Link to={howPath}>{t.nav.how}</Link>
                <Link to={path("/portail")}>{t.nav.portal}</Link>
                <Link to={path("/outils")}>{t.nav.tools}</Link>
                <Link to={path("/grow-hub")}>{t.nav.grow}</Link>
                <Link to={path("/forfaits-cellulaire")}>{t.nav.cellulaire}</Link>
                <Link to={path("/modules-ia")}>{t.nav.modulesIa}</Link>
              </nav>
            </div>

            <div className="site-footer__col">
              <p className="site-footer__label">{lang === "fr" ? "Entreprise" : "Company"}</p>
              <nav className="site-footer__links" aria-label={lang === "fr" ? "Entreprise" : "Company"}>
                <Link to={path("/qui-sommes-nous")}>{t.nav.mission}</Link>
                <Link to={path("/equipe")}>{t.nav.team}</Link>
                <Link to={path("/services")}>{t.nav.services}</Link>
                <Link to={path("/faq")}>{t.nav.faq}</Link>
                <Link to={path("/contact")}>{t.nav.contact}</Link>
              </nav>
            </div>

            <div className="site-footer__col">
              <p className="site-footer__label">{lang === "fr" ? "Contact" : "Contact"}</p>
              <nav className="site-footer__links" aria-label={lang === "fr" ? "Contact" : "Contact"}>
                <a href={MAPS_SEARCH_URL} target="_blank" rel="noopener noreferrer">
                  313 Cuvillier Ouest
                </a>
                <a href={PHONES.local.href}>{PHONES.local.display}</a>
                <a href={PHONES.tollFree.href}>{PHONES.tollFree.display}</a>
                <a href={`mailto:${EMAILS.service}`}>{lang === "fr" ? "Service client" : "Client service"}</a>
                <a href={`mailto:${EMAILS.accounting}`}>{lang === "fr" ? "Facturation" : "Billing"}</a>
              </nav>
            </div>
          </div>

          <div className="site-footer__bar">
            <p className="site-footer__meta">
              <span>© {new Date().getFullYear()} {t.brand}</span>
              <span className="site-footer__sep" aria-hidden="true">
                ·
              </span>
              <span>
                {lang === "fr" ? "Né au Québec. Conçu pour le monde." : "Born in Québec. Built for the world."}
              </span>
            </p>
            <nav className="site-footer__legal" aria-label={lang === "fr" ? "Mentions légales" : "Legal"}>
              <Link to={path("/confidentialite")}>{lang === "fr" ? "Confidentialité" : "Privacy"}</Link>
              <Link to={path("/conditions")}>{lang === "fr" ? "Conditions" : "Terms"}</Link>
              <Link to={path("/remboursement")}>{lang === "fr" ? "Remboursement" : "Refund"}</Link>
            </nav>
            <nav className="site-footer__social" aria-label={lang === "fr" ? "Réseaux sociaux" : "Social"}>
              <FooterSocialIcon href={SOCIAL.facebook} label="Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9Z" />
                </svg>
              </FooterSocialIcon>
              <FooterSocialIcon href={SOCIAL.twitter} label="X">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M18.244 3H21l-6.52 7.45L22 21h-6.19l-4.84-5.91L5.4 21H2.64l6.97-7.97L2 3h6.35l4.37 5.39L18.244 3Zm-1.09 16.2h1.72L7.01 4.7H5.16l11.99 14.5Z" />
                </svg>
              </FooterSocialIcon>
              <FooterSocialIcon href={SOCIAL.tiktok} label="TikTok">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M19.6 7.3a5.4 5.4 0 0 1-3.2-1.1v7.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a2.9 2.9 0 1 0 2 2.8V2.5h2.7a5.4 5.4 0 0 0 3.3 4.8v0Z" />
                </svg>
              </FooterSocialIcon>
              <FooterSocialIcon href={SOCIAL.instagram} label="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
                </svg>
              </FooterSocialIcon>
            </nav>
          </div>
        </div>
      </footer>
      )}
      {embed ? null : <AiSecretary />}
    </>
  );
}

