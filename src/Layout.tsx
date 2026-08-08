import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLang } from "./i18n";
import { APP_QR_PATH, footerAppQrUrl } from "./appConfig";
import { scoreCopy } from "./scoreCopy";
import { AiSecretary } from "./AiSecretary";
import { ContactDetails } from "./ContactDetails";

export function Layout() {
  const { t, lang, path } = useLang();
  const sc = scoreCopy[lang];
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
      <NavLink to={path("/qui-sommes-nous")}>{t.nav.mission}</NavLink>
      <NavLink to={path("/faq")}>{t.nav.faq}</NavLink>
    </>
  );

  return (
    <>
      <header className="site-header">
        <div className="shell site-header__inner">
          <Link to={path("/")} className="brand" aria-label={`${t.brand} home`}>
            <img
              className="brand__logo"
              src="/logo.png"
              width={160}
              height={40}
              alt={t.brand}
              decoding="async"
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
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="shell site-footer__grid">
          <div className="site-footer__brand">
            <p className="brand__name">{t.brand}</p>
            <p className="site-footer__tagline">{t.footer}</p>
            <a
              className="footer-qr"
              href={footerAppQrUrl(lang)}
              rel="noopener noreferrer"
              aria-label={t.footerQrTitle}
            >
              <img
                className="footer-qr__img"
                src={APP_QR_PATH}
                width={96}
                height={96}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="footer-qr__text">
                <span className="footer-qr__title">{t.footerQrTitle}</span>
                <span className="footer-qr__hint">{t.footerQrHint}</span>
              </span>
            </a>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__label">{lang === "fr" ? "Produit" : "Product"}</p>
            <nav className="site-footer__links" aria-label="Footer product">
              <Link to={path("/forfaits")}>{t.nav.pricing}</Link>
              <Link to={howPath}>{t.nav.how}</Link>
              <Link to={path("/portail")}>{t.nav.portal}</Link>
              <Link to={path("/outils")}>{t.nav.tools}</Link>
              <Link to={path("/grow-hub")}>{t.nav.grow}</Link>
            </nav>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__label">{lang === "fr" ? "Entreprise" : "Company"}</p>
            <nav className="site-footer__links" aria-label="Footer company">
              <Link to={path("/qui-sommes-nous")}>{t.nav.mission}</Link>
              <Link to={path("/equipe")}>{t.nav.team}</Link>
              <Link to={path("/faq")}>{t.nav.faq}</Link>
              <Link to={path("/contact")}>{t.nav.contact}</Link>
              <Link to={path("/confidentialite")}>{t.privacy}</Link>
              <Link to={path("/conditions")}>{t.terms}</Link>
            </nav>
          </div>

          <div className="site-footer__contact">
            <p className="site-footer__label">
              {lang === "fr" ? "Bureau & contact" : "Office & contact"}
            </p>
            <ContactDetails compact />
          </div>
        </div>
        <div className="shell site-footer__bottom">
          <p>© {new Date().getFullYear()} {t.brand}</p>
          <p>{lang === "fr" ? "Né au Québec. Conçu pour le monde." : "Born in Québec. Built for the world."}</p>
        </div>
      </footer>
      <AiSecretary />
    </>
  );
}
