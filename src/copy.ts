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
    modulesIa: string;
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
  refund: string;
  privacyBody: string;
  termsBody: string;
  refundBody: string;
};

export const copy: Record<Lang, Copy> = {
  fr: {
    brand: "BlackWayConnect",
    tagline: "Du premier contact au revenu.",
    nav: {
      grow: "Grow Hub",
      tools: "Outils",
      services: "Services",
      pricing: "Forfaits",
      how: "Comment ça marche",
      cellulaire: "Pack Cellulaire",
      modulesIa: "Chatbot + Accueil vocal IA",
      mission: "Mission",
      team: "Équipe",
      contact: "Contact",
      faq: "FAQ",
      portal: "Portail",
    },
    ctaConsult: "Réserver une consultation",
    ctaGrow: "Voir Grow Hub en action",
    ctaPricing: "Comparer les forfaits",
    ctaBuy: "S’abonner — Wix",
    ctaApp: "Ouvrir le portail",
    ctaAppStore: "App Store",
    ctaPlayStore: "Google Play",
    appEyebrow: "Inclus avec Grow Hub",
    appTitle: "Le portail client est inclus.",
    appBody:
      "Chaque forfait Grow Hub ouvre le portail sur le web et dans le navigateur mobile. Les applications de magasin arrivent ensuite. Le pack cellulaire est optionnel.",
    appNote:
      "Le portail s’ouvre depuis le site. Le pack terrain se choisit à part.",
    heroEyebrow: "Québec · Mondial",
    heroTitle: "Du premier contact au paiement.",
    heroBody:
      "Chaque demande est classée, suivie, puis encaissée dans le même dossier. Growth : 349 $ par mois, facturé dès l’abonnement, annulable.",
    office: {
      eyebrow: "Bureau BlackWayConnect",
      title: "Une journée dans le système.",
      body: "Du matin où le suivi commercial s’ouvre jusqu’aux décisions qui ferment la journée — l’équipe gère le revenu, pas une jungle d’onglets.",
      beats: {
        morning: {
          label: "08:30",
          title: "Ouverture du bureau",
          body: "Les demandes de la nuit sont déjà évaluées. Priorités claires avant le premier café.",
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
      { value: "Twin", label: "Turbo Volume + Qualité" },
      { value: "60 s", label: "Diagnostic Master Leads" },
      { value: "FR / EN", label: "Parcours bilingues" },
      { value: "Wix", label: "Paiement sécurisé" },
    ],
    growTitle: "Un suivi en trois étapes.",
    growBody:
      "La demande entre, elle est classée, la prochaine action est claire. Le suivi ne dépend plus d’une boîte courriel.",
    growPoints: [
      "Le site, les formulaires et les campagnes alimentent un seul dossier.",
      "L’urgence, le budget et la langue décident de la priorité.",
      "Relance, soumission et paiement restent dans le même fil.",
    ],
    plansTitle: "Un forfait adapté à votre entreprise.",
    plansBody:
      "Prix en dollars canadiens, taxes en sus. Tous les forfaits se paient en ligne avec Wix, dès l’abonnement, puis se renouvellent mensuellement.",
    plans: [
      {
        key: "grow_hub_spark",
        name: "Spark",
        price: "99 $ / mois",
        blurb: "Pour démarrer : dossier client et secrétaire IA.",
      },
      {
        key: "grow_hub_launch",
        name: "Launch",
        price: "149 $ / mois",
        blurb: "Relances et soumissions suivies, sans tableur à part.",
      },
      {
        key: "grow_hub_growth",
        name: "Growth",
        price: "349 $ / mois",
        blurb: "Le palier recommandé : score, relances, soumissions et paiements.",
      },
      {
        key: "grow_hub_scale",
        name: "Scale",
        price: "699 $ / mois",
        blurb: "Plusieurs équipes sur la même plateforme.",
      },
      {
        key: "grow_hub_command",
        name: "Command",
        price: "1 249 $ / mois",
        blurb: "L’équipe BlackWay opère le suivi avec vous.",
      },
      {
        key: "grow_hub_partner",
        name: "Partner",
        price: "2 499 $ / mois",
        blurb: "Plateforme et mandat, pour un volume plus élevé.",
      },
    ],
    servicesTitle: "Quatre solutions. Un dossier client.",
    servicesBody:
      "Site, application, secrétaire et visibilité écrivent dans le même suivi commercial.",
    services: [
      {
        title: "Sites web et conversion",
        body: "Reliez vos pages, votre référencement local et vos formulaires au suivi de vos occasions de vente.",
      },
      {
        title: "Applications web et mobiles",
        body: "Centralisez les portails clients et les applications autour des dossiers de votre CRM, sans double saisie.",
      },
      {
        title: "Agents IA et automatisation",
        body: "Simplifiez les conversations, les relances et les opérations avec des agents IA supervisés par votre équipe.",
      },
      {
        title: "SEO et acquisition",
        body: "Suivez votre visibilité locale, vos contenus et vos sources de demandes pour guider vos efforts commerciaux.",
      },
    ],
    marketTitle: "Conçu au Québec. Utilisable ailleurs.",
    marketBody:
      "Le parcours est en français et en anglais. Le paiement en ligne fonctionne au Canada, aux États-Unis et en Europe.",
    consultTitle: "Besoin d’aide pour choisir ?",
    consultBody:
      "Décrivez votre volume de demandes. On indique le forfait qui correspond, ou on en parle avant l’abonnement.",
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
      "Stratèges, concepteurs et spécialistes des opérations réunis pour structurer vos ventes et votre suivi client.",
    teamGallery: [
      {
        src: "/office-team.jpg",
        title: "Des opérations coordonnées",
        body: "Votre équipe retrouve les priorités et les prochaines actions dans un même espace de suivi.",
      },
      {
        src: "/team/team-collab.jpg",
        title: "Une équipe bien informée",
        body: "La stratégie et les actions de votre équipe s’appuient sur le même dossier client.",
      },
      {
        src: "/office-ops.jpg",
        title: "Un suivi commercial clair",
        body: "Chaque dossier rassemble le contexte, les priorités et la prochaine action à entreprendre.",
      },
    ],
    mission: {
      eyebrow: "Qui nous sommes",
      title: "Notre mission : simplifier votre croissance.",
      body: "BlackWayConnect bâtit le système commercial bilingue qui transforme chaque demande en prochaine action qui encaisse — du Québec au reste du monde.",
      heroSrc: "/photos/brand-pillar.jpg",
      heroTitle: "Votre vision. Notre solution. Votre succès.",
      heroBody: "Une plateforme pour centraliser vos demandes, structurer vos suivis et accompagner votre croissance.",
      visionTitle: "La vision",
      visionBody:
        "Un seul fil du premier clic au paiement Wix. Moins de friction, plus de suivi des revenus — pour les équipes qui vendent vraiment.",
      valuesTitle: "Ce qui nous guide",
      values: [
        {
          title: "Des besoins bien définis",
          body: "Nous évaluons vos besoins avant de proposer des outils adaptés à votre activité.",
        },
        {
          title: "Un suivi centralisé",
          body: "Vos demandes, vos soumissions et votre suivi commercial restent associés au même dossier.",
        },
        {
          title: "Un parcours bilingue",
          body: "Vos parcours et vos messages sont adaptés en français et en anglais dans un même environnement.",
        },
      ],
      photos: [
        {
          src: "/team/team-collab.jpg",
          title: "L’équipe qui tient le système",
          body: "Une équipe qui partage le contexte de chaque dossier pour coordonner ses prochaines actions.",
        },
        {
          src: "/office-ops.jpg",
          title: "Connectés pour encaisser",
          body: "Infrastructure, identité de marque et collaboration soutiennent le suivi de vos activités.",
        },
      ],
    },
    field: {
      eyebrow: "Sur le terrain",
      title: "L’équipe en action — pas une brochure.",
      body: "Derrière le Grow Hub : des humains qui alignent suivi commercial, opérations et marque. Voici le terrain BlackWay.",
      items: [
        {
          src: "/photos/field-01.jpg",
          title: "Coordination commerciale",
          body: "Autour du bois, devant la carte — chaque prospect a une prochaine action.",
        },
        {
          src: "/photos/brand-pillar.jpg",
          title: "La marque qui tient debout",
          body: "Noir, rouge #e10600, message net — votre vision devient notre exécution.",
        },
      ],
    },
    proofTitle: "Ce qui est inclus avec Grow Hub.",
    proofBody: "Le paiement, le dossier client et le portail font partie du même abonnement.",
    proofItems: [
      "Paiement en ligne en dollars canadiens, facturé dès l’abonnement, annulable.",
      "Chaque demande reste dans un dossier, du premier message au paiement.",
      "Le portail client est inclus, sur le web et sur mobile.",
      "Français et anglais, sans deuxième système.",
    ],
    proofQuotes: [],
    proofNote: "",
    faqTitle: "Questions fréquentes.",
    faqBody: "Les réponses courtes, avant de comparer les forfaits.",
    faq: [
      {
        q: "Puis-je m’abonner sans appel ?",
        a: "Oui. Tous les forfaits Grow Hub, le Pack Cellulaire et les modules IA (chatbot, accueil vocal) se paient en ligne. L’offre Entreprise se discute d’abord.",
      },
      {
        q: "Avez-vous un service client 24h ?",
        a: "La secrétaire du site répond en tout temps. Pour une personne : serviceclient@blackwayconnect.com.",
      },
      {
        q: "Où sont vos bureaux ?",
        a: "313 Cuvillier Ouest, local 302, J4L 0B2, Québec, Canada. La carte Google est dans le pied de page et sur la page Contact.",
      },
      {
        q: "Où vont mes prospects et paiements ?",
        a: "Les demandes du site et le paiement en ligne arrivent dans le même dossier client.",
      },
      {
        q: "Le français et l’anglais sont-ils supportés ?",
        a: "Oui. Le site, le suivi et le paiement fonctionnent en français et en anglais.",
      },
      {
        q: "Quel forfait choisir ?",
        a: "Spark pour essayer. Launch pour structurer. Growth pour vendre et mesurer. Scale, Command et Partner quand plusieurs personnes travaillent le même suivi commercial.",
      },
      {
        q: "Problème de facturation ?",
        a: "Écrivez à accounting@blackwayconnect.com. Pour le service général : serviceclient@blackwayconnect.com.",
      },
    ],
    contactAside: "Ou commencez par un forfait.",
    contactFast: "Comparez les forfaits ou utilisez le formulaire pour poser une question à notre équipe.",
    footer: "Du prospect au revenu. Un seul système de croissance connecté.",
    footerQrTitle: "Portail client",
    footerQrHint: "Scannez pour ouvrir le Portail Client Master — inclus avec votre forfait.",
    privacy: "Politique de confidentialité",
    terms: "Conditions d’utilisation",
    refund: "Politique de remboursement",
    privacyBody:
      "Politique de confidentialité — BlackWayConnect (Canada) traite les données de contact, de compte et d'utilisation pour répondre à vos demandes, opérer le Grow Hub et sécuriser le service. Aucune vente de listes à des tiers. Les paiements en ligne peuvent être traités par un processeur de paiement (ex. Wix). Contact : serviceclient@blackwayconnect.com · 313 Cuvillier Ouest #302, Longueuil (QC) J4L 0B2.",
    termsBody:
      "Conditions d’utilisation — L'utilisation du site et des services BlackWayConnect implique l'acceptation des présentes conditions, de la politique de confidentialité et de la politique de remboursement. Les services sont fournis selon les forfaits convenus ; montants en CAD sauf indication contraire. Usage interdit à des fins illégales ou abusives. BlackWayConnect / 9495-5457 Québec Inc., Canada. Contact : serviceclient@blackwayconnect.com.",
    refundBody:
      "Politique de remboursement — Vous pouvez annuler un abonnement selon les modalités de l'offre ; l'accès demeure en général jusqu'à la fin de la période déjà payée. Les frais déjà engagés ne sont pas automatiquement remboursables ; chaque demande est évaluée selon la loi applicable (incluant la protection du consommateur au Québec/Canada) et les services fournis. Demande : serviceclient@blackwayconnect.com (idéalement sous 14 jours) avec date, montant et référence de transaction.",
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
      modulesIa: "AI Chatbot + Voice reception",
      mission: "Mission",
      team: "Team",
      contact: "Contact",
      faq: "FAQ",
      portal: "Portal",
    },
    ctaConsult: "Book a consultation",
    ctaGrow: "See Grow Hub in action",
    ctaPricing: "Compare plans",
    ctaBuy: "Subscribe — Wix",
    ctaApp: "Open the portal",
    ctaAppStore: "App Store",
    ctaPlayStore: "Google Play",
    appEyebrow: "Included with Grow Hub",
    appTitle: "The client portal is included.",
    appBody:
      "Every Grow Hub plan opens the portal on the web and in the mobile browser. Store apps come later. The cellular pack is optional.",
    appNote: "Open the portal from the site. The field pack is chosen separately.",
    heroEyebrow: "Québec · Global",
    heroTitle: "From the first lead to payment.",
    heroBody:
      "Each request is sorted, followed up, and collected in the same record. Growth is $349 a month, billed immediately at subscription, cancel anytime.",
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
      { value: "Twin", label: "Volume + Quality turbos" },
      { value: "60 s", label: "Master Leads diagnostic" },
      { value: "FR / EN", label: "Bilingual journeys" },
      { value: "Wix", label: "Secure checkout" },
    ],
    growTitle: "Three steps. Not a pile of tools.",
    growBody:
      "The request comes in, it is sorted, and the next action is clear. Follow-up no longer depends on an inbox.",
    growPoints: [
      "The site, forms and campaigns feed one client record.",
      "Urgency, budget and language set the priority.",
      "Follow-up, quote and payment stay in the same thread.",
    ],
    plansTitle: "Pick the level. Keep the same system.",
    plansBody:
      "Prices in Canadian dollars, before tax. Every plan is paid online with Wix at subscription, then renews monthly.",
    plans: [
      {
        key: "grow_hub_spark",
        name: "Spark",
        price: "$99 / mo",
        blurb: "To start: a client record and the AI secretary.",
      },
      {
        key: "grow_hub_launch",
        name: "Launch",
        price: "$149 / mo",
        blurb: "Follow-ups and quotes tracked, without a side spreadsheet.",
      },
      {
        key: "grow_hub_growth",
        name: "Growth",
        price: "$349 / mo",
        blurb: "The recommended level: scoring, follow-ups, quotes and payments.",
      },
      {
        key: "grow_hub_scale",
        name: "Scale",
        price: "$699 / mo",
        blurb: "Several teams on the same platform.",
      },
      {
        key: "grow_hub_command",
        name: "Command",
        price: "$1,249 / mo",
        blurb: "The BlackWay team runs follow-up with you.",
      },
      {
        key: "grow_hub_partner",
        name: "Partner",
        price: "$2,499 / mo",
        blurb: "Platform and retainer, for a higher volume.",
      },
    ],
    servicesTitle: "Four uses. One client record.",
    servicesBody: "Site, app, secretary and visibility write into the same pipeline.",
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
    marketTitle: "Built in Québec. Usable elsewhere.",
    marketBody:
      "The journey is in French and English. Online payment works in Canada, the United States and Europe.",
    consultTitle: "A question before you choose.",
    consultBody:
      "Describe your volume of requests. We point to the plan that fits, or we talk before you subscribe.",
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
        "One thread from first click to Wix payment. Less friction, more revenue provenance — for teams that actually sell.",
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
    proofTitle: "What Grow Hub includes.",
    proofBody: "Payment, the client record and the portal are part of the same subscription.",
    proofItems: [
      "Online payment in Canadian dollars, billed at subscription, cancel anytime.",
      "Each request stays in one record, from the first message to payment.",
      "The client portal is included, on the web and on mobile.",
      "French and English, without a second system.",
    ],
    proofQuotes: [],
    proofNote: "",
    faqTitle: "Common questions.",
    faqBody: "Short answers, before you compare plans.",
    faq: [
      {
        q: "Can I subscribe without a call?",
        a: "Yes. Every Grow Hub plan, the Cellular Pack and the AI modules (chatbot, voice reception) are paid online. Enterprise is discussed first.",
      },
      {
        q: "Do you offer 24/7 client service?",
        a: "The on-site secretary answers at any time. For a person: serviceclient@blackwayconnect.com.",
      },
      {
        q: "Where is your office?",
        a: "313 Cuvillier Ouest, suite 302, J4L 0B2, Québec, Canada. See the Google Map in the footer and on the Contact page.",
      },
      {
        q: "Where do leads and payments go?",
        a: "Site requests and online payment land in the same client record.",
      },
      {
        q: "Are French and English supported?",
        a: "Yes. The site, follow-up and payment work in French and English.",
      },
      {
        q: "Which plan should I pick?",
        a: "Spark to try it. Launch to structure the work. Growth to sell and measure. Scale, Command and Partner when several people share the same pipeline.",
      },
      {
        q: "Billing issue?",
        a: "Email accounting@blackwayconnect.com. For general support: serviceclient@blackwayconnect.com.",
      },
    ],
    contactAside: "Or start with a plan.",
    contactFast: "Every plan is paid online. The form is for questions and Enterprise offers.",
    footer: "From lead to revenue. One connected growth system.",
    footerQrTitle: "Client portal",
    footerQrHint: "Scan to open the Client Master Portal — included with your plan.",
    privacy: "Privacy Notice",
    terms: "Terms of Service",
    refund: "Refund Policy",
    privacyBody:
      "Privacy Notice — BlackWayConnect (Canada) processes contact, account and usage data to answer requests, operate Grow Hub and secure the service. We do not sell lists to third parties. Online payments may be handled by a payment processor (e.g. Wix). Contact: serviceclient@blackwayconnect.com · 313 Cuvillier Ouest #302, Longueuil, QC J4L 0B2.",
    termsBody:
      "Terms of Service — Use of the BlackWayConnect site and services means you accept these Terms, the Privacy Notice and the Refund Policy. Services are delivered per agreed plans; amounts are CAD unless stated otherwise. Illegal or abusive use is prohibited. BlackWayConnect / 9495-5457 Quebec Inc., Canada. Contact: serviceclient@blackwayconnect.com.",
    refundBody:
      "Refund Policy — You may cancel a subscription per the offer terms; access usually continues through the paid period. Fees already charged are not automatically refundable; each request is reviewed under applicable law (including Québec/Canada consumer protection) and services delivered. Request: serviceclient@blackwayconnect.com (ideally within 14 days) with date, amount and transaction reference.",
  },
};
