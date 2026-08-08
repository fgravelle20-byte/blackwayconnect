import { EMAILS, MAPS_EMBED_URL, MAPS_SEARCH_URL, OFFICE, PHONES, SOCIAL } from "./siteContact";
import { useLang } from "./i18n";

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6.5 3.5h3.2l1.2 4.2-2 1.4a12.5 12.5 0 0 0 5.5 5.5l1.4-2 4.2 1.2v3.2a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}

function IconBill({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3Z" />
      <path d="M10 9h4M10 13h4" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9Z" />
    </svg>
  );
}

function IconTwitter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 3H21l-6.52 7.45L22 21h-6.19l-4.84-5.91L5.4 21H2.64l6.97-7.97L2 3h6.35l4.37 5.39L18.244 3Zm-1.09 16.2h1.72L7.01 4.7H5.16l11.99 14.5Z" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M19.6 7.3a5.4 5.4 0 0 1-3.2-1.1v7.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a2.9 2.9 0 1 0 2 2.8V2.5h2.7a5.4 5.4 0 0 0 3.3 4.8v0Z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

type Props = {
  showMap?: boolean;
  compact?: boolean;
};

export function ContactDetails({ showMap = true, compact = false }: Props) {
  const { lang } = useLang();
  const billing =
    lang === "fr" ? "Problèmes de facturation" : "Billing issues";
  const mapsLabel = lang === "fr" ? "Ouvrir dans Google Maps" : "Open in Google Maps";
  const socialLabel = lang === "fr" ? "Réseaux sociaux" : "Social networks";

  return (
    <div className={`contact-details${compact ? " contact-details--compact" : ""}`}>
      <ul className="contact-lines">
        <li>
          <IconPin className="contact-lines__icon" />
          <div>
            <a href={MAPS_SEARCH_URL} target="_blank" rel="noopener noreferrer">
              {OFFICE.street}
            </a>
            <span className="contact-lines__sub">{OFFICE.cityLine}</span>
          </div>
        </li>
        <li>
          <IconPhone className="contact-lines__icon" />
          <div>
            <a href={PHONES.local.href}>{PHONES.local.display}</a>
            <span className="contact-lines__sub">
              {lang === "fr" ? "Local / #1" : "Local / #1"}
            </span>
          </div>
        </li>
        <li>
          <IconPhone className="contact-lines__icon" />
          <div>
            <a href={PHONES.tollFree.href}>
              {lang === "fr"
                ? `Sans frais : ${PHONES.tollFree.display}`
                : `Toll-free: ${PHONES.tollFree.display}`}
            </a>
          </div>
        </li>
        <li>
          <IconMail className="contact-lines__icon" />
          <div>
            <a href={`mailto:${EMAILS.service}`}>{EMAILS.service}</a>
            <span className="contact-lines__sub">
              {lang === "fr" ? "Service client" : "Client service"}
            </span>
          </div>
        </li>
        <li>
          <IconBill className="contact-lines__icon" />
          <div>
            <a href={`mailto:${EMAILS.accounting}`}>{EMAILS.accounting}</a>
            <span className="contact-lines__sub">{billing}</span>
          </div>
        </li>
      </ul>

      <div className="social-row" aria-label={socialLabel}>
        <a
          className="social-link"
          href={SOCIAL.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <IconFacebook />
        </a>
        <a
          className="social-link"
          href={SOCIAL.twitter}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (Twitter)"
        >
          <IconTwitter />
        </a>
        <a
          className="social-link"
          href={SOCIAL.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
        >
          <IconTikTok />
        </a>
        <a
          className="social-link"
          href={SOCIAL.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <IconInstagram />
        </a>
      </div>

      {showMap ? (
        <div className="office-map">
          <iframe
            title={lang === "fr" ? "Bureau BlackWayConnect — Google Maps" : "BlackWayConnect office — Google Maps"}
            src={MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a className="office-map__open" href={MAPS_SEARCH_URL} target="_blank" rel="noopener noreferrer">
            {mapsLabel}
          </a>
        </div>
      ) : null}
    </div>
  );
}
