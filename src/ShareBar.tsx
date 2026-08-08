import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLang } from "./i18n";

const SITE = "https://blackwayconnect.com";

export type ShareVariant = "home" | "diagnostic" | "outils" | "forfaits" | "grow-hub";

type ShareCopy = {
  title: string;
  text: string;
  proofEyebrow: string;
  proofTitle: string;
  proofBody: string;
  shareLabel: string;
  nativeLabel: string;
  copiedLabel: string;
  channels: { key: string; label: string }[];
};

function shareCopy(variant: ShareVariant, lang: "fr" | "en"): ShareCopy {
  const fr = lang === "fr";
  const base = {
    proofEyebrow: fr ? "Partage" : "Share",
    shareLabel: fr ? "Partager" : "Share",
    nativeLabel: fr ? "Partager maintenant" : "Share now",
    copiedLabel: fr ? "Lien copié" : "Link copied",
    channels: [
      { key: "linkedin", label: "LinkedIn" },
      { key: "x", label: "X" },
      { key: "facebook", label: "Facebook" },
      { key: "whatsapp", label: "WhatsApp" },
    ],
  };

  const byVariant: Record<ShareVariant, Pick<ShareCopy, "title" | "text" | "proofTitle" | "proofBody">> = {
    home: {
      title: "BlackWayConnect",
      text: fr
        ? "BlackWayConnect — plateforme lead-to-revenue bilingue (CA/US). Un système pour fermer plus."
        : "BlackWayConnect — bilingual lead-to-revenue platform (CA/US). One system to close more.",
      proofTitle: fr ? "Faites circuler le système, pas un compteur fantôme." : "Spread the system — not a fake counter.",
      proofBody: fr
        ? "Pas de « 500k likes ». Quand une équipe partage BlackWayConnect, Master Tools et le Leak Score voyagent pour de vrai."
        : "No “500k likes.” When a team shares BlackWayConnect, Master Tools and Leak Score travel for real.",
    },
    diagnostic: {
      title: fr ? "Revenue Leak Score — BlackWayConnect" : "Revenue Leak Score — BlackWayConnect",
      text: fr
        ? "J’ai fait le Revenue Leak Score (60 s). Diagnostic de fuite lead → paiement. Essayez-le :"
        : "I ran the Revenue Leak Score (60s). Lead → payment leak diagnostic. Try it:",
      proofTitle: fr ? "Partagez ce diagnostic" : "Share this diagnostic",
      proofBody: fr
        ? "Le Leak Score se propage quand les équipes l’envoient. Un lien clair vaut mieux qu’un compteur inventé."
        : "Leak Score spreads when teams send it. A clear link beats an invented counter.",
    },
    outils: {
      title: fr ? "Master Tools — BlackWayConnect" : "Master Tools — BlackWayConnect",
      text: fr
        ? "Master Tools : Leak Score, relance panier, soumission Stripe, checklist, Grow Hub, ROI. Arsenal lead-to-revenue :"
        : "Master Tools: Leak Score, cart recovery, Stripe quotes, checklist, Grow Hub, ROI. Lead-to-revenue arsenal:",
      proofTitle: fr ? "Partagez ces outils" : "Share these tools",
      proofBody: fr
        ? "Envoyez Master Tools à un associé. Viralité honnête : un kit utile, pas des likes fictifs."
        : "Send Master Tools to a partner. Honest virality: a useful kit, not fake likes.",
    },
    forfaits: {
      title: fr ? "Forfaits Grow Hub — BlackWayConnect" : "Grow Hub plans — BlackWayConnect",
      text: fr
        ? "Forfaits Grow Hub Spark → Partner (CAD). Plateforme + exécution bilingue :"
        : "Grow Hub plans Spark → Partner (CAD). Platform + bilingual execution:",
      proofTitle: fr ? "Partagez les forfaits" : "Share the plans",
      proofBody: fr
        ? "Transférez la grille tarifaire. Décision claire pour CA/US — sans inflation sociale."
        : "Forward the pricing grid. Clear CA/US decision — without social inflation.",
    },
    "grow-hub": {
      title: fr ? "Grow Hub — BlackWayConnect" : "Grow Hub — BlackWayConnect",
      text: fr
        ? "Aperçu Grow Hub : pipeline bilingue, prochaines actions, chemin vers l’abonnement."
        : "Grow Hub preview: bilingual pipeline, next actions, path to subscribe.",
      proofTitle: fr ? "Partagez Grow Hub" : "Share Grow Hub",
      proofBody: fr
        ? "Montrez le pipeline. Momentum réel = partages utiles, pas des badges inventés."
        : "Show the pipeline. Real momentum = useful shares, not invented badges.",
    },
  };

  return { ...base, ...byVariant[variant] };
}

function absoluteUrl(pathname: string) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE}${path === "/" ? "/" : path}`;
}

type Props = {
  variant: ShareVariant;
  /** Override share URL (e.g. always FR canonical). */
  url?: string;
  className?: string;
  compact?: boolean;
};

export function ShareBar({ variant, url, className = "", compact = false }: Props) {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const copy = useMemo(() => shareCopy(variant, lang), [variant, lang]);
  const shareUrl = url || absoluteUrl(pathname);
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(copy.text);

  const links = useMemo(
    () => ({
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    }),
    [encodedUrl, encodedText],
  );

  const onNative = useCallback(async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: copy.title, text: copy.text, url: shareUrl });
        setStatus("shared");
        return;
      } catch {
        /* user cancelled or unsupported payload */
      }
    }
    try {
      await navigator.clipboard.writeText(`${copy.text} ${shareUrl}`);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      window.open(links.x, "_blank", "noopener,noreferrer");
    }
  }, [copy, shareUrl, links.x]);

  return (
    <aside className={`share-bar${compact ? " share-bar--compact" : ""} ${className}`.trim()} aria-label={copy.shareLabel}>
      {!compact ? (
        <div className="share-bar__proof">
          <p className="eyebrow">{copy.proofEyebrow}</p>
          <h2 className="share-bar__title">{copy.proofTitle}</h2>
          <p className="share-bar__body">{copy.proofBody}</p>
        </div>
      ) : (
        <p className="share-bar__compact-label">{copy.proofTitle}</p>
      )}

      <div className="share-bar__actions">
        <button type="button" className="btn btn--primary share-bar__native" onClick={onNative}>
          {status === "copied" ? copy.copiedLabel : copy.nativeLabel}
        </button>
        <div className="share-bar__channels" role="group" aria-label={copy.shareLabel}>
          {copy.channels.map((ch) => (
            <a
              key={ch.key}
              className={`share-chip share-chip--${ch.key}`}
              href={links[ch.key as keyof typeof links]}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="share-chip__mark" aria-hidden="true" />
              <span>{ch.label}</span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
