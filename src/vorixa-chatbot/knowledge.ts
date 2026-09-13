import { CLINIC } from "./config";
import type { LeadDraft, VorixaLead } from "./types";

const PHONE_RE = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const NAME_RE =
  /(?:je m['’]appelle|mon nom est|c['’]est|moi c['’]est)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\s-]{1,40})/i;

export type ReplyResult = {
  reply: string;
  draft: LeadDraft;
  lead: Omit<VorixaLead, "id" | "chatbot_id" | "conversation_id" | "createdAt" | "statut"> | null;
};

export function emptyDraft(): LeadDraft {
  return { nom: "", telephone: "", courriel: "", besoin: "", urgence: false };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

function prettyPhone(raw: string): string {
  const d = digits(raw);
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (ten.length === 10) return `${ten.slice(0, 3)} ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return raw.trim();
}

function clipName(raw: string): string {
  return raw
    .replace(/[.,!?].*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

function bareName(message: string): string {
  const leftover = message
    .replace(EMAIL_RE, " ")
    .replace(PHONE_RE, " ")
    .replace(/[,;:/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!leftover || leftover.length > 48) return "";
  if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-]+(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-]+){0,3}$/.test(leftover)) return "";
  return clipName(leftover);
}

export function mergeFromMessage(message: string, draft: LeadDraft): LeadDraft {
  const next = { ...draft };
  const email = message.match(EMAIL_RE);
  if (email) next.courriel = email[0];
  const phone = message.match(PHONE_RE);
  if (phone && digits(phone[0]).length >= 10) next.telephone = prettyPhone(phone[0]);
  const named = message.match(NAME_RE);
  if (named) next.nom = clipName(named[1]);
  else if (!next.nom) {
    const inferred = bareName(message);
    if (inferred) next.nom = inferred;
  }
  const n = norm(message);
  if (/(urgence|mal de dent|dent cassee|abcès|abces|saigne|douleur (forte|intense)|enflé|enfle)/.test(n)) {
    next.urgence = true;
  }
  if (!next.besoin && message.trim().length > 12 && !PHONE_RE.test(message) && !EMAIL_RE.test(message)) {
    if (!/^(oui|non|ok|daccord|d'accord|svp|s'il vous plait)$/.test(n.trim())) {
      next.besoin = message.trim().slice(0, 180);
    }
  }
  return next;
}

function hoursBlock(): string {
  return CLINIC.hours.map((h) => `${h.day} : ${h.hours}`).join("\n");
}

function leadReady(d: LeadDraft): boolean {
  return Boolean(d.nom && d.telephone);
}

function askNext(d: LeadDraft): string {
  if (!d.nom) return "Pour qu’on vous réserve un rappel, quel est votre nom ?";
  if (!d.telephone) return "Merci. À quel numéro la clinique peut-elle vous joindre ?";
  return "";
}

function captureClose(d: LeadDraft): string {
  const urgency = d.urgence
    ? `Si la douleur est forte, composez aussi ${CLINIC.phoneDisplay} tout de suite.`
    : `Quelqu’un de la clinique vous rappellera aux heures d’ouverture.`;
  return [
    `C’est noté${d.nom ? `, ${d.nom.split(" ")[0]}` : ""}.`,
    `Rappel demandé${d.besoin ? ` pour : ${d.besoin}` : ""}.`,
    `Téléphone : ${d.telephone}${d.courriel ? ` · Courriel : ${d.courriel}` : ""}.`,
    urgency,
  ]
    .filter(Boolean)
    .join(" ");
}

function infoReply(message: string): string | null {
  const n = norm(message);

  if (/(adresse|ou etes|où êtes|ou vous trouvez|stationnement|comment s'y rendre)/.test(n)) {
    return `${CLINIC.legal} est au ${CLINIC.address}, ${CLINIC.cityLine}. Le plus simple : ${CLINIC.phoneDisplay}. Voulez-vous qu’on vous rappelle pour un rendez-vous ?`;
  }
  if (/(heure|horaire|ouvert|ferme|quand)/.test(n)) {
    return `Heures affichées sur la page Contact :\n${hoursBlock()}\n\nPour confirmer une plage, appelez le ${CLINIC.phoneDisplay} ou laissez-moi votre nom et téléphone.`;
  }
  if (/(telephone|appeler|numero|numéro|fax)/.test(n)) {
    return `Téléphone : ${CLINIC.phoneDisplay}. Télécopieur : ${CLINIC.fax}. Courriel : ${CLINIC.email}.`;
  }
  if (/(equipe|équipe|dentiste|gallant|rochon|gauthier|lauzon|boutet|jacinthe|professionnels)/.test(n)) {
    return `L’équipe :\n${CLINIC.team.map((t) => `• ${t}`).join("\n")}\n\nSouhaitez-vous un rappel pour rencontrer un dentiste ?`;
  }
  if (/(cerec|couronne en une|une visite)/.test(n)) {
    return `Oui — la clinique propose des couronnes CEREC, souvent en une visite. Je peux prendre vos coordonnées pour un rappel, ou vous pouvez appeler le ${CLINIC.phoneDisplay}.`;
  }
  if (/(invisalign|aligneur|orthodont)/.test(n)) {
    return `Dre Lauzon offre des aligneurs transparents. Donnez-moi votre nom et téléphone, la clinique vous rappelle pour évaluer si c’est indiqué.`;
  }
  if (/(implant|facette|blanchiment|gencive|canal|sedation|sédation|denturolog|pont|chirurgie|atm|ronflement)/.test(n)) {
    return `Oui, ${CLINIC.legal} couvre notamment : ${CLINIC.services.slice(0, 8).join(", ")}. Je n’affiche pas de tarifs ici — un rappel ou un appel au ${CLINIC.phoneDisplay} permettra de qualifier votre besoin.`;
  }
  if (/(prix|cout|coût|tarif|combien| ramq|assurance)/.test(n)) {
    return `Je ne peux pas inventer de tarifs. La clinique confirmera selon l’examen. Laissez votre nom et téléphone, ou composez le ${CLINIC.phoneDisplay}.`;
  }
  if (/(merci|parfait|super|c'est tout|c est tout)/.test(n)) {
    return `Avec plaisir. Si vous avez besoin d’un rendez-vous, je peux déjà noter un rappel.`;
  }
  return null;
}

export function replyTo(message: string, draftIn: LeadDraft): ReplyResult {
  const text = message.trim();
  let draft = mergeFromMessage(text, draftIn);
  const n = norm(text);

  const wantsCapture =
    draft.urgence ||
    /(rdv|rendez-vous|rappel|reservation|réserver|reserver|prendre rendez|nouveau patient|premiere visite|première visite|consultation)/.test(
      n,
    ) ||
    /(urgence|mal de dent|douleur)/.test(n);

  if (wantsCapture && !draft.besoin) {
    draft = {
      ...draft,
      besoin: draft.urgence ? "Urgence dentaire" : "Demande de rendez-vous",
    };
  }

  if (leadReady(draft) && (wantsCapture || draft.besoin)) {
    return { reply: captureClose(draft), draft: emptyDraft(), lead: { ...draft } };
  }

  if (wantsCapture || draft.nom || draft.telephone) {
    const ask = askNext(draft);
    if (draft.urgence && ask) {
      return {
        reply: `Pour une urgence, le plus rapide reste d’appeler le ${CLINIC.phoneDisplay}. ${ask}`,
        draft,
        lead: null,
      };
    }
    if (ask) return { reply: ask, draft, lead: null };
  }

  const informed = infoReply(text);
  if (informed) return { reply: informed, draft, lead: null };

  if (/(salut|allo|allô|bonjour|bonsoir|hey|hi)/.test(n) && n.length < 24) {
    return {
      reply: `Bonjour — je suis l’assistant de ${CLINIC.brand} à Laval. Rendez-vous, urgence, horaires ou un soin en particulier ?`,
      draft,
      lead: null,
    };
  }

  return {
    reply: `Je peux vous aider pour un rendez-vous, une urgence, les horaires, l’adresse ou un soin (${CLINIC.services[0]}, implants, aligneurs…). Dites-moi votre besoin, ou laissez votre nom et téléphone pour un rappel au ${CLINIC.phoneDisplay}.`,
    draft,
    lead: null,
  };
}
