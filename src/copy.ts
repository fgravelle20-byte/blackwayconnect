export type Lang = "fr" | "en";

export type Copy = {
  brand: string;
  tagline: string;
  nav: {
    grow: string;
    tools: string;
    services: string;
    pricing: string;
    how: string;
    cellulaire: string;
    mission: string;
    team: string;
    contact: string;
    faq: string;
    portal: string;
  };
  ctaConsult: string;
  ctaGrow: string;
  ctaPricing: string;
  ctaBuy: string;
  ctaApp: string;
  ctaAppStore: string;
  ctaPlayStore: string;
  appEyebrow: string;
  appTitle: string;
  appBody: string;
  appNote: string;
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  office: {
    eyebrow: string;
    title: string;
    body: string;
    beats: {
      morning: { label: string; title: string; body: string };
      team: { label: string; title: string; body: string };
      ops: { label: string; title: string; body: string };
    };
  };
  confidence: { label: string; value: string }[];
  growTitle: string;
  growBody: string;
  growPoints: string[];
  plansTitle: string;
  plansBody: string;
  plans: {
    name: string;
    price: string;
    blurb: string;
    key:
      | "grow_hub_spark"
      | "grow_hub_launch"
      | "grow_hub_growth"
      | "grow_hub_scale"
      | "grow_hub_command"
      | "grow_hub_partner";
  }[];
  servicesTitle: string;
  servicesBody: string;
  services: { title: string; body: string }[];
  marketTitle: string;
  marketBody: string;
  consultTitle: string;
  consultBody: string;
  form: {
    first: string;
    last: string;
    email: string;
    company: string;
    phone: string;
    message: string;
    plan: string;
    submit: string;
    success: string;
    error: string;
  };
  teamTitle: string;
  teamBody: string;
  teamGallery: { src: string; title: string; body: string; optional?: boolean }[];
  mission: {
    eyebrow: string;
    title: string;
    body: string;
    heroSrc: string;
    heroTitle: string;
    heroBody: string;
    visionTitle: string;
    visionBody: string;
    valuesTitle: string;
    values: { title: string; body: string }[];
    photos: { src: string; title: string; body: string; optional?: boolean }[];
  };
  field: {
    eyebrow: string;
    title: string;
    body: string;
    items: { src: string; title: string; body: string; optional?: boolean }[];
  };
  proofTitle: string;
  proofBody: string;
  proofItems: string[];
  proofQuotes: { quote: string; role: string }[];
  proofNote: string;
  faqTitle: string;
  faqBody: string;
  faq: { q: string; a: string }[];
  contactAside: string;
  contactFast: string;
  footer: string;
  footerQrTitle: string;
  footerQrHint: string;
  privacy: string;
  terms: string;
  privacyBody: string;
  termsBody: string;
};

export const copy: Record<Lang, Copy> = {
  fr: {
    brand: "BlackWayConnect",
    tagline: "Du lead au revenu. Sans fuite.",
    nav: {
      grow: "Grow Hub",
      tools: "Outils",
      services: "Services",
      pricing: "Forfaits",
      how: "Comment ça marche",
      cellulaire: "Pack Cellulaire",
      mission: "Mission",
      team: "Équipe",
      contact: "Contact",
      faq: "FAQ",
      portal: "Portail",
    },
    ctaConsult: "Réserver une consultation",
    ctaGrow: "Voir Grow Hub en action",
    ctaPricing: "Comparer les forfaits",
    ctaBuy: "S’abonner — Stripe",
    ctaApp: "Ouvrir le portail",
    ctaAppStore: "App Store",
    ctaPlayStore: "Google Play",
    appEyebrow: "Inclus avec Grow Hub",
    appTitle: "Votre portail client, accessible partout.",
    appBody:
      "Chaque forfait Grow Hub inclut le Portail Client Master sur web et mobile — mêmes outils, même compte. Le Pack Cellulaire (outils terrain) demeure optionnel.",
    appNote:
      "Portail inclus → /portail. Pack terrain optionnel → /forfaits-cellulaire.",
    heroEyebrow: "Québec · Mondial",
    heroTitle: "Du lead au revenu, sans fuite.",
    heroBody:
      "Système commercial bilingue FR/EN : scoring, relances, soumissions et paiements. Grow Hub Growth — 499 $/mois, Stripe, annulable. Portail inclus dès le jour 1.",
    office: {
      eyebrow: "Bureau BlackWayConnect",
      title: "Une journée dans le système.",
      body: "Du matin où le pipeline s’ouvre jusqu’aux décisions qui ferment la journée — l’équipe gère le revenu, pas une jungle d’onglets.",
      beats: {
        morning: {
          label: "08:30",
          title: "Ouverture du bureau",
          body: "Les demandes de la nuit sont déjà scorées. Priorités claires avant le premier café.",
        },
        team: {
          label: "11:00",
          title: "Équipe alignée",
          body: "Stratégie et exécution sur le même dossier prospect — une source de vérité, zéro version conflictuelle.",
        },
        ops: {
          label: "16:00",
          title: "Opérations et clôture",
          body: "Soumissions, relances et paiements avancent ensemble. Rien ne reste dans une boîte courriel.",
        },
      },
    },
    confidence: [
      { value: "60 s", label: "Diagnostic Leak Score" },
      { value: "FR / EN", label: "Parcours bilingues" },
      { value: "CA + US", label: "Deux marchés" },
      { value: "1", label: "Provenance revenu" },
    ],
    growTitle: "De la première visite au revenu récurrent.",
    growBody:
      "Grow Hub indique la prochaine action pour chaque occasion — puis automatise le suivi pour que rien ne refroidisse entre le formulaire et le paiement.",
    growPoints: [
      "Site, formulaires et campagnes → un seul dossier prospect, scoré.",
      "Urgence, budget et langue fixent la priorité réelle — pas l’ordre d’arrivée.",
      "Pipeline, relances, soumissions et paiements avancent dans le même fil.",
    ],
    plansTitle: "Commencez léger. Montez sans changer de système.",
    plansBody:
      "Abonnement mensuel en CAD via Stripe. Portail Client Master + accès mobile inclus (surplus). Chaque palier ajoute de la capacité — pas une nouvelle plateforme. Pack Cellulaire = outils terrain optionnels.",
    plans: [
      {
        key: "grow_hub_spark",
        name: "Spark",
        price: "99 $ / mois",
        blurb: "Pipeline + secrétaire IA 24h — validez le stack sans engagement lourd.",
      },
      {
        key: "grow_hub_launch",
        name: "Launch",
        price: "249 $ / mois",
        blurb: "Pipeline structuré, relances cadrées, soumissions suivies.",
      },
      {
        key: "grow_hub_growth",
        name: "Growth",
        price: "499 $ / mois",
        blurb: "Score, relances, soumissions et paiements mesurés — le moteur recommandé.",
      },
      {
        key: "grow_hub_scale",
        name: "Scale",
        price: "749 $ / mois",
        blurb: "Multi-équipes et automatisations avancées — une seule plateforme revenu.",
      },
      {
        key: "grow_hub_command",
        name: "Command",
        price: "1 249 $ / mois",
        blurb: "Ops CRM + acquisition gérée — exécution, pas seulement un logiciel.",
      },
      {
        key: "grow_hub_partner",
        name: "Partner",
        price: "2 499 $ / mois",
        blurb: "Plateforme + mandat niveau agence — pour remplacer le patchwork.",
      },
    ],
    servicesTitle: "Une plateforme. Une équipe pour bâtir autour.",
    servicesBody:
      "Ajoutez seulement ce qui augmente le revenu ou réduit le coût d’acquisition — toujours branché sur Grow Hub.",
    services: [
      {
        title: "Sites haute conversion",
        body: "Pages, SEO local et formulaires reliés au pipeline — chaque visite peut devenir une occasion suivie.",
      },
      {
        title: "Applications web et mobile",
        body: "Portails clients et produits sur les mêmes données que votre CRM — zéro double saisie.",
      },
      {
        title: "Agents IA et automatisations",
        body: "Chat, routage, suivis et opérations supervisées — l’IA accélère, l’équipe décide.",
      },
      {
        title: "SEO et acquisition",
        body: "Visibilité locale, contenu et mesure des sources — vous savez ce qui remplit le pipeline.",
      },
    ],
    marketTitle: "Né au Québec. Vendu partout dans le monde.",
    marketBody:
      "Europe, Amériques, ailleurs — si un client veut Grow Hub, il s’abonne. Paiement Stripe mondial, parcours bilingues FR/EN, un seul système.",
    consultTitle: "Parlez à l’équipe BlackWay.",
    consultBody:
      "Décrivez votre pipeline et votre volume de leads — nous recommandons le forfait Grow Hub adapté, ou une consultation stratégique avant d’acheter.",
    form: {
      first: "Prénom",
      last: "Nom",
      email: "Courriel",
      company: "Entreprise",
      phone: "Téléphone",
      message: "Message",
      plan: "Forfait visé",
      submit: "Envoyer la demande",
      success: "Demande reçue. Nous vous contactons sous peu.",
      error: "Envoi impossible. Réessayez ou écrivez à serviceclient@blackwayconnect.com.",
    },
    teamTitle: "L’équipe derrière le système.",
    teamBody:
      "Stratèges, builders et opérateurs focalisés sur le revenu encaissé — pas sur la collection d’outils à la mode.",
    teamGallery: [
      {
        src: "/office-team.jpg",
        title: "Ops qui ferme la journée",
        body: "Écrans allumés, priorités scorées — l’équipe lit le pipeline, pas une jungle d’onglets.",
      },
      {
        src: "/team/team-collab.jpg",
        title: "Autour de la table, une seule vérité",
        body: "Connect. Build. Grow. — stratégie et exécution sur le même dossier prospect.",
      },
      {
        src: "/office-ops.jpg",
        title: "Focus pipeline",
        body: "Un dossier à la fois — lecture, score, prochaine action. Pas de théâtre.",
      },
      {
        src: "/photos/slot-atelier.jpg",
        title: "Atelier terrain",
        body: "Prochaine photo : déposez-la dans public/photos/incoming/ — le slot s’active tout seul.",
        optional: true,
      },
      {
        src: "/photos/slot-ops.jpg",
        title: "Ops en direct",
        body: "Slot prêt pour IMG_2084 / IMG_2068 — accroche professionnelle dès le drop.",
        optional: true,
      },
    ],
    mission: {
      eyebrow: "Qui nous sommes",
      title: "Notre mission : du lead au revenu, sans fuite.",
      body: "BlackWayConnect bâtit le système commercial bilingue qui transforme chaque demande en prochaine action qui encaisse — du Québec au reste du monde.",
      heroSrc: "/photos/brand-pillar.jpg",
      heroTitle: "Votre vision. Notre solution. Votre succès.",
      heroBody: "Connect. Build. Grow. — une marque noire et rouge, une promesse claire : fermer plus sans empiler d’outils.",
      visionTitle: "La vision",
      visionBody:
        "Un seul fil du premier clic au paiement Stripe. Moins de friction, plus de provenance revenu — pour les équipes qui vendent vraiment.",
      valuesTitle: "Ce qui nous guide",
      values: [
        {
          title: "Preuve avant gadget",
          body: "On diagnostique la fuite avant de vendre du bruit technologique.",
        },
        {
          title: "Une provenance revenu",
          body: "Site, CRM, soumissions et paiements dans le même système — zéro version conflictuelle.",
        },
        {
          title: "Bilingue par design",
          body: "FR/EN, CA/US — parcours et messages adaptés sans dupliquer la stack.",
        },
      ],
      photos: [
        {
          src: "/team/team-collab.jpg",
          title: "L’équipe qui tient le système",
          body: "Sept regards, une table, une carte monde — BlackWayConnect en formation de combat commercial.",
        },
        {
          src: "/office-ops.jpg",
          title: "Connectés pour encaisser",
          body: "Infrastructure, branding, collaboration : le terrain où le revenu se décide.",
        },
        {
          src: "/photos/slot-mission.jpg",
          title: "Prochaine scène mission",
          body: "Slot ouvert — déposez IMG_2275 ou EA1F9549 dans public/photos/incoming/.",
          optional: true,
        },
      ],
    },
    field: {
      eyebrow: "Sur le terrain",
      title: "L’équipe en action — pas une brochure.",
      body: "Derrière le Grow Hub : des humains qui alignent pipeline, ops et marque. Voici le terrain BlackWay.",
      items: [
        {
          src: "/photos/field-01.jpg",
          title: "War room commerciale",
          body: "Autour du bois, devant la carte — chaque lead a une prochaine action.",
        },
        {
          src: "/photos/brand-pillar.jpg",
          title: "La marque qui tient debout",
          body: "Noir, rouge #e10600, message net — votre vision devient notre exécution.",
        },
      ],
    },
    proofTitle: "Infrastructure commerciale, pas une pile d’outils.",
    proofBody: "Paiements, CRM et portail client — un fil continu du premier clic à l’encaissement.",
    proofItems: [
      "Stripe : abonnements et paiements en CAD, annulables, sans friction.",
      "HubSpot : pipeline et opportunités synchronisés avec le dossier prospect.",
      "Portail Client Master : dashboard web et mobile inclus avec Grow Hub.",
      "Parcours bilingue FR/EN — une source de vérité, partout dans le monde.",
    ],
    proofQuotes: [],
    proofNote: "",
    faqTitle: "Questions avant de démarrer.",
    faqBody: "Réponses nettes pour choisir un forfait, un diagnostic ou une consultation.",
    faq: [
      {
        q: "Puis-je m’abonner sans appel ?",
        a: "Oui. Les forfaits Spark à Partner s’ouvrent en Stripe Checkout. L’offre Entreprise se discute en consultation. Les Master Tools (/outils) aident à choisir le palier.",
      },
      {
        q: "Avez-vous un service client 24h ?",
        a: "Oui. La Secrétaire IA BlackWay (Conseiller 24h) répond en continu sur le site — forfaits, diagnostic, Grow Hub et prise de coordonnées. Pour un humain : serviceclient@blackwayconnect.com.",
      },
      {
        q: "Où sont vos bureaux ?",
        a: "313 Cuvillier Ouest, local 302, J4L 0B2, Québec, Canada. La carte Google est dans le pied de page et sur la page Contact.",
      },
      {
        q: "Où vont mes leads et paiements ?",
        a: "Le site et l’app envoient les demandes vers HubSpot via notre couche d’intégration. Les webhooks Stripe alimentent le même CRM — paiements et abandons visibles rapidement.",
      },
      {
        q: "Le français et l’anglais sont-ils supportés ?",
        a: "Oui. Français et anglais sur le site, les parcours et le CRM. Un client en Europe, au Canada ou ailleurs s’abonne via Stripe comme tout le monde.",
      },
      {
        q: "Quel forfait choisir ?",
        a: "Spark pour tester, Launch pour structurer, Growth (recommandé) pour vendre et mesurer, Scale / Command / Partner pour multi-équipes, ops et mandat. Comparez aussi sur /forfaits ou /comment-ca-marche.",
      },
      {
        q: "Problème de facturation ?",
        a: "Écrivez à accounting@blackwayconnect.com. Pour le service général : serviceclient@blackwayconnect.com.",
      },
    ],
    contactAside: "Préférez démarrer tout de suite ?",
    contactFast: "Choisissez un forfait — paiement sécurisé Stripe, sans formulaire long.",
    footer: "Du lead au revenu. Un seul système de croissance connecté.",
    footerQrTitle: "Portail client",
    footerQrHint: "Scannez pour ouvrir le Portail Client Master — inclus avec votre forfait.",
    privacy: "Confidentialité",
    terms: "Conditions",
    privacyBody:
      "BlackWayConnect traite les données de contact pour répondre à vos demandes et opérer le Grow Hub. Aucune vente de listes. Contact : serviceclient@blackwayconnect.com.",
    termsBody:
      "Les services sont fournis selon les forfaits convenus. Les montants sont en CAD sauf indication contraire. BlackWayConnect Inc., Canada.",
  },
  en: {
    brand: "BlackWayConnect",
    tagline: "From lead to revenue. No leakage.",
    nav: {
      grow: "Grow Hub",
      tools: "Tools",
      services: "Services",
      pricing: "Plans",
      how: "How it works",
      cellulaire: "Cellular Pack",
      mission: "Mission",
      team: "Team",
      contact: "Contact",
      faq: "FAQ",
      portal: "Portal",
    },
    ctaConsult: "Book a consultation",
    ctaGrow: "See Grow Hub in action",
    ctaPricing: "Compare plans",
    ctaBuy: "Subscribe — Stripe",
    ctaApp: "Open the portal",
    ctaAppStore: "App Store",
    ctaPlayStore: "Google Play",
    appEyebrow: "Included with Grow Hub",
    appTitle: "Your client portal, available everywhere.",
    appBody:
      "Every Grow Hub plan includes the Client Master Portal on web and mobile — same tools, same account. The Cellular Pack (field tools) remains optional.",
    appNote:
      "Portal included → /portail. Optional field pack → /forfaits-cellulaire.",
    heroEyebrow: "Québec · Global",
    heroTitle: "From lead to revenue, without leakage.",
    heroBody:
      "Bilingual FR/EN commercial system: scoring, follow-ups, quotes and payments. Grow Hub Growth — $499/mo, Stripe, cancel anytime. Portal included on day one.",
    office: {
      eyebrow: "BlackWayConnect office",
      title: "A day inside the system.",
      body: "From morning pipeline open to the decisions that close the day — the team runs revenue, not a tab jungle.",
      beats: {
        morning: {
          label: "08:30",
          title: "Office opens",
          body: "Overnight inquiries are already scored. Priorities clear before the first coffee.",
        },
        team: {
          label: "11:00",
          title: "Team aligned",
          body: "Strategy and build on the same prospect record — one source of truth, zero conflicting versions.",
        },
        ops: {
          label: "16:00",
          title: "Ops and close",
          body: "Quotes, follow-ups and payments move together. Nothing dies in an inbox.",
        },
      },
    },
    confidence: [
      { value: "60 s", label: "Leak Score diagnostic" },
      { value: "FR / EN", label: "Bilingual journeys" },
      { value: "CA + US", label: "Two markets" },
      { value: "1", label: "Revenue provenance" },
    ],
    growTitle: "From first visit to recurring revenue.",
    growBody:
      "Grow Hub names the next action for every opportunity — then automates follow-through so nothing cools between form and payment.",
    growPoints: [
      "Site, forms and campaigns → one scored prospect record.",
      "Urgency, budget and language set real priority — not arrival order.",
      "Pipeline, follow-ups, quotes and payments move in one thread.",
    ],
    plansTitle: "Start light. Scale without switching systems.",
    plansBody:
      "Monthly CAD via Stripe. Client Master Portal + mobile access included (surplus). Each tier adds capacity — not a new platform. Cellular Pack = optional field tools.",
    plans: [
      {
        key: "grow_hub_spark",
        name: "Spark",
        price: "$99 / mo",
        blurb: "Pipeline + 24/7 AI secretary — prove the stack without overcommitting.",
      },
      {
        key: "grow_hub_launch",
        name: "Launch",
        price: "$249 / mo",
        blurb: "Structured pipeline, disciplined follow-ups, quotes tracked.",
      },
      {
        key: "grow_hub_growth",
        name: "Growth",
        price: "$499 / mo",
        blurb: "Scoring, follow-ups, quotes and payments measured — the recommended engine.",
      },
      {
        key: "grow_hub_scale",
        name: "Scale",
        price: "$749 / mo",
        blurb: "Multi-team advanced automation — one revenue platform.",
      },
      {
        key: "grow_hub_command",
        name: "Command",
        price: "$1,249 / mo",
        blurb: "CRM ops + managed acquisition — execution, not software alone.",
      },
      {
        key: "grow_hub_partner",
        name: "Partner",
        price: "$2,499 / mo",
        blurb: "Platform + agency retainer — replace the tool patchwork.",
      },
    ],
    servicesTitle: "One platform. One team to build around it.",
    servicesBody:
      "Add only what raises revenue or cuts acquisition cost — always wired into Grow Hub.",
    services: [
      {
        title: "High-conversion sites",
        body: "Pages, local SEO and forms wired to the pipeline — every visit can become a tracked opportunity.",
      },
      {
        title: "Web and mobile apps",
        body: "Client portals and products on the same data as your CRM — no double entry.",
      },
      {
        title: "AI agents and automation",
        body: "Chat, routing, follow-ups and supervised ops — AI accelerates, the team decides.",
      },
      {
        title: "SEO and acquisition",
        body: "Local visibility, content and source measurement — you know what fills the pipeline.",
      },
    ],
    marketTitle: "Born in Québec. Sold worldwide.",
    marketBody:
      "Europe, the Americas, anywhere — if a client wants Grow Hub, they subscribe. Global Stripe checkout, bilingual FR/EN journeys, one system.",
    consultTitle: "Talk to the BlackWay team.",
    consultBody:
      "Share your pipeline and lead volume — we’ll recommend the right Grow Hub plan, or a strategy consult before you buy.",
    form: {
      first: "First name",
      last: "Last name",
      email: "Email",
      company: "Company",
      phone: "Phone",
      message: "Message",
      plan: "Target plan",
      submit: "Send request",
      success: "Request received. We will reach out shortly.",
      error: "Could not send. Retry or email serviceclient@blackwayconnect.com.",
    },
    teamTitle: "The team behind the system.",
    teamBody:
      "Strategists, builders and operators focused on cash collected — not collecting trendy tools.",
    teamGallery: [
      {
        src: "/office-team.jpg",
        title: "Ops that closes the day",
        body: "Screens on, priorities scored — the team reads the pipeline, not a tab jungle.",
      },
      {
        src: "/team/team-collab.jpg",
        title: "One table, one source of truth",
        body: "Connect. Build. Grow. — strategy and build on the same prospect record.",
      },
      {
        src: "/office-ops.jpg",
        title: "Pipeline focus",
        body: "One file at a time — read, score, next action. No theatre.",
      },
      {
        src: "/photos/slot-atelier.jpg",
        title: "Field atelier",
        body: "Next photo: drop it in public/photos/incoming/ — the slot activates itself.",
        optional: true,
      },
      {
        src: "/photos/slot-ops.jpg",
        title: "Live ops",
        body: "Slot ready for IMG_2084 / IMG_2068 — professional caption on drop.",
        optional: true,
      },
    ],
    mission: {
      eyebrow: "Who we are",
      title: "Our mission: lead to revenue, no leakage.",
      body: "BlackWayConnect builds the bilingual commercial system that turns every inquiry into the next action that collects — from Québec to the world.",
      heroSrc: "/photos/brand-pillar.jpg",
      heroTitle: "Your vision. Our solution. Your success.",
      heroBody: "Connect. Build. Grow. — black and red brand, clear promise: close more without stacking tools.",
      visionTitle: "The vision",
      visionBody:
        "One thread from first click to Stripe payment. Less friction, more revenue provenance — for teams that actually sell.",
      valuesTitle: "What guides us",
      values: [
        {
          title: "Proof before gadgets",
          body: "We diagnose the leak before selling tech noise.",
        },
        {
          title: "One revenue provenance",
          body: "Site, CRM, quotes and payments in one system — zero conflicting versions.",
        },
        {
          title: "Bilingual by design",
          body: "FR/EN, CA/US — journeys and messaging adapted without duplicating the stack.",
        },
      ],
      photos: [
        {
          src: "/team/team-collab.jpg",
          title: "The team that runs the system",
          body: "Seven stares, one table, one world map — BlackWayConnect in commercial formation.",
        },
        {
          src: "/office-ops.jpg",
          title: "Connected to collect",
          body: "Infrastructure, branding, collaboration: the field where revenue decides.",
        },
        {
          src: "/photos/slot-mission.jpg",
          title: "Next mission frame",
          body: "Open slot — drop IMG_2275 or EA1F9549 into public/photos/incoming/.",
          optional: true,
        },
      ],
    },
    field: {
      eyebrow: "In the field",
      title: "The team in action — not a brochure.",
      body: "Behind Grow Hub: humans who align pipeline, ops and brand. This is BlackWay on the ground.",
      items: [
        {
          src: "/photos/field-01.jpg",
          title: "Commercial war room",
          body: "Around the wood, facing the map — every lead gets a next action.",
        },
        {
          src: "/photos/brand-pillar.jpg",
          title: "The brand that stands",
          body: "Black, red #e10600, sharp message — your vision becomes our execution.",
        },
      ],
    },
    proofTitle: "Commercial infrastructure, not a tool stack.",
    proofBody: "Payments, CRM and client portal — one continuous thread from first click to cash.",
    proofItems: [
      "Stripe: CAD subscriptions and payments, cancel anytime, no friction.",
      "HubSpot: pipeline and opportunities synced to the prospect record.",
      "Client Master Portal: web and mobile dashboard included with Grow Hub.",
      "Bilingual FR/EN journeys — one source of truth, worldwide.",
    ],
    proofQuotes: [],
    proofNote: "",
    faqTitle: "Questions before you start.",
    faqBody: "Clear answers to pick a plan, a diagnostic or a consultation.",
    faq: [
      {
        q: "Can I subscribe without a call?",
        a: "Yes. Spark through Partner open in Stripe Checkout. Enterprise is scoped in consultation. Master Tools (/outils) help you pick the tier.",
      },
      {
        q: "Do you offer 24/7 client service?",
        a: "Yes. The BlackWay AI Secretary (Advisor 24h) answers around the clock — plans, diagnostic, Grow Hub and lead capture. For a human: serviceclient@blackwayconnect.com.",
      },
      {
        q: "Where is your office?",
        a: "313 Cuvillier Ouest, suite 302, J4L 0B2, Québec, Canada. See the Google Map in the footer and on the Contact page.",
      },
      {
        q: "Where do leads and payments go?",
        a: "The site and app send inquiries into HubSpot through our integration layer. Stripe webhooks feed the same CRM — payments and abandonments visible quickly.",
      },
      {
        q: "Are French and English supported?",
        a: "Yes. French and English on the site, journeys and CRM. A client in Europe, Canada or anywhere else subscribes via Stripe like everyone else.",
      },
      {
        q: "Which plan should I pick?",
        a: "Spark to test, Launch to structure, Growth (recommended) to sell and measure, Scale / Command / Partner for multi-team, ops and retainer. Compare on /forfaits or /how-it-works.",
      },
      {
        q: "Billing issue?",
        a: "Email accounting@blackwayconnect.com. For general support: serviceclient@blackwayconnect.com.",
      },
    ],
    contactAside: "Prefer to start now?",
    contactFast: "Pick a plan — secure Stripe checkout, no long form.",
    footer: "From lead to revenue. One connected growth system.",
    footerQrTitle: "Client portal",
    footerQrHint: "Scan to open the Client Master Portal — included with your plan.",
    privacy: "Privacy",
    terms: "Terms",
    privacyBody:
      "BlackWayConnect processes contact data to answer requests and operate Grow Hub. No list selling. Contact: serviceclient@blackwayconnect.com.",
    termsBody:
      "Services are delivered per agreed plans. Amounts are CAD unless stated otherwise. BlackWayConnect Inc., Canada.",
  },
};
