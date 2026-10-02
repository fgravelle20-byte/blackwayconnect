import type { ReactNode } from "react";
import { useLang } from "./i18n";

/** Shared editorial introduction for public product pages. */
export function PageIntro({ children, image }: { children: ReactNode; image: string }) {
  const { lang } = useLang();
  return (
    <div className="page-intro">
      <div className="page-hero">{children}</div>
      <figure className="page-intro__media">
        <img src={image} alt={lang === "fr" ? "Illustration d’un environnement de travail numérique" : "Illustration of a digital work environment"} width={1536} height={1024} decoding="async" />
        <figcaption>{lang === "fr" ? "BlackWayConnect · Un espace pour vos demandes et vos outils." : "BlackWayConnect · One place for your requests and tools."}</figcaption>
      </figure>
    </div>
  );
}

export function PageLoading() {
  const { lang } = useLang();
  return <div className="shell page-loading" role="status"><span className="eyebrow">BlackWayConnect</span><p>{lang === "fr" ? "Chargement de votre page…" : "Loading your page…"}</p></div>;
}
