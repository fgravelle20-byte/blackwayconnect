import { Link } from "react-router-dom";
import { useLang } from "./i18n";
import { PhotoFigure } from "./PhotoFigure";

/** Home strip after OfficeDay — adds photos without touching hero/office media. */
export function FieldStrip() {
  const { t, path } = useLang();
  const f = t.field;

  return (
    <section className="section section--field" id="terrain" aria-labelledby="field-title">
      <div className="shell">
        <div className="section__head section__head--wide">
          <p className="eyebrow">{f.eyebrow}</p>
          <h2 id="field-title">{f.title}</h2>
          <p>{f.body}</p>
        </div>
        <div className="photo-rail">
          {f.items.map((item) => (
            <PhotoFigure
              key={item.src + item.title}
              src={item.src}
              title={item.title}
              body={item.body}
              optional={item.optional}
            />
          ))}
        </div>
        <div className="cta-row" style={{ marginTop: "1.75rem" }}>
          <Link className="btn btn--primary" to={path("/qui-sommes-nous")}>
            {t.nav.mission}
          </Link>
          <Link className="btn btn--ghost" to={path("/equipe")}>
            {t.nav.team}
          </Link>
        </div>
      </div>
    </section>
  );
}
