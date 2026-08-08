import { Link } from "react-router-dom";
import { useLang } from "./i18n";
import { CinematicMedia } from "./CinematicMedia";

/**
 * Full-bleed hero plane.
 * Drop `public/hero.mp4` or `public/office-day.mp4` — poster + film-strip until then.
 */
export function Hero() {
  const { t, path, lang } = useLang();
  const howPath = path(lang === "en" ? "/how-it-works" : "/comment-ca-marche");

  return (
    <section className="hero" aria-labelledby="hero-brand">
      <CinematicMedia
        videoSrc="/hero.mp4"
        fallbackVideoSrc="/office-day.mp4"
        poster="/hero-poster.jpg"
        stills={["/hero-poster.jpg", "/office-team.jpg", "/office-morning.jpg"]}
      />
      <div className="shell hero__content">
        <h1 id="hero-brand" className="display">
          {t.brand}
        </h1>
        <p className="hero-line">{t.heroTitle}</p>
        <p className="lede">{t.heroBody}</p>
        <div className="cta-row">
          <Link className="btn btn--primary" to={path("/forfaits-growth")}>
            {lang === "fr" ? "Commencer avec Growth — 499 $/mois" : "Start with Growth — $499/mo"}
          </Link>
          <Link className="btn btn--ghost" to={howPath}>
            {t.nav.how}
          </Link>
        </div>
      </div>
    </section>
  );
}
