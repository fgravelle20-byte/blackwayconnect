import { ConvertStickyBar } from "../ConvertStickyBar";
import { RevenueLeakScore } from "../RevenueLeakScore";
import { useLang } from "../i18n";
import { scoreCopy } from "../scoreCopy";

export function DiagnosticPage() {
  const { lang, path } = useLang();
  const sc = scoreCopy[lang];
  const fr = lang === "fr";
  return (
    <>
      <section className="section section--page section--with-convert-bar">
        <div className="shell rls-page">
          <div className="page-hero">
            <p className="eyebrow">{sc.eyebrow}</p>
            <h1 className="display page-hero__title">{sc.title}</h1>
            <p className="lede">{sc.body}</p>
          </div>
          <RevenueLeakScore />
        </div>
      </section>
      <ConvertStickyBar
        primaryHref={path("/forfaits-growth")}
        primaryLabel={fr ? "Voir Growth — 499 $" : "See Growth — $499"}
      />
    </>
  );
}
