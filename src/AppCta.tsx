import { Link } from "react-router-dom";
import { APP_STORE_URL, PLAY_STORE_URL } from "./appConfig";
import { useLang } from "./i18n";

/** Pitch: mobile dashboard included with Grow Hub; Pack Cellulaire = optional surplus. */
export function AppCta() {
  const { t, path } = useLang();

  return (
    <section className="section" id="app" aria-labelledby="app-title">
      <div className="shell app-cta">
        <div className="section__head" style={{ marginBottom: 0 }}>
          <p className="eyebrow">{t.appEyebrow}</p>
          <h2 id="app-title">{t.appTitle}</h2>
          <p>{t.appBody}</p>
          <p className="app-cta__note">{t.appNote}</p>
        </div>
        <div className="app-cta__actions">
          <Link className="btn btn--primary" to={path("/portail")}>
            {t.ctaApp}
          </Link>
          <Link className="btn btn--ghost" to={path("/forfaits")}>
            {t.nav.pricing}
          </Link>
          <Link className="btn btn--ghost" to={path("/forfaits-cellulaire")}>
            {t.nav.cellulaire}
          </Link>
          {APP_STORE_URL ? (
            <a className="btn btn--ghost" href={APP_STORE_URL} rel="noopener noreferrer" target="_blank">
              {t.ctaAppStore}
            </a>
          ) : null}
          {PLAY_STORE_URL ? (
            <a className="btn btn--ghost" href={PLAY_STORE_URL} rel="noopener noreferrer" target="_blank">
              {t.ctaPlayStore}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
