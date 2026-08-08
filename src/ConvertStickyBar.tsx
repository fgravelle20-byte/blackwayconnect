import { Link } from "react-router-dom";
import { useLang } from "./i18n";
import { PHONES } from "./siteContact";

type Props = {
  /** Primary action — buy link or internal path */
  primaryHref: string;
  primaryLabel: string;
  /** If true, primary is external (Stripe). */
  external?: boolean;
  onPrimaryClick?: () => void;
};

/** Sticky dual-phone + CTA — conversion pages only. */
export function ConvertStickyBar({ primaryHref, primaryLabel, external, onPrimaryClick }: Props) {
  const { lang } = useLang();
  const fr = lang === "fr";

  return (
    <div className="growth-ads-bar" role="region" aria-label={fr ? "Appeler ou continuer" : "Call or continue"}>
      <div className="growth-ads-bar__inner">
        <a className="btn btn--ghost growth-ads-bar__call" href={PHONES.local.href}>
          {PHONES.local.display}
        </a>
        <a className="btn btn--ghost growth-ads-bar__call" href={PHONES.tollFree.href}>
          {fr ? "Sans frais" : "Toll-free"} {PHONES.tollFree.display}
        </a>
        {external ? (
          <a
            className="btn btn--primary growth-ads-bar__buy"
            href={primaryHref}
            rel="noopener noreferrer"
            target="_blank"
            onClick={onPrimaryClick}
          >
            {primaryLabel}
          </a>
        ) : (
          <Link className="btn btn--primary growth-ads-bar__buy" to={primaryHref} onClick={onPrimaryClick}>
            {primaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
