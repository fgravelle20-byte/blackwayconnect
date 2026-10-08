import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { EMAILS, PHONES } from "../siteContact";
import "./how-it-works.css";

const CONTENT = {
  fr: {
    eyebrow: "BlackWayConnect · Le parcours expliqué",
    title: "Une demande entre. Vous savez quoi faire ensuite.",
    intro: "BlackWayConnect réunit la capture des demandes, les outils de suivi et le portail client. Voici où commencer, quoi utiliser et comment avancer, étape par étape.",
    start: "Faire mon diagnostic", plans: "Comparer les forfaits", caption: "La capture, le suivi et les opérations dans un même environnement.",
    process: "Du premier contact au suivi client.", processBody: "Chaque étape a un objectif précis. Vous gardez la main sur les réponses, les offres et les décisions.",
    steps: [
      { title: "Recevez la demande au bon endroit.", body: "Le formulaire du site et la secrétaire IA permettent de recueillir les coordonnées et le besoin du prospect. Le portail propose aussi un outil de capture pour ajouter une demande vous-même.", action: "Vous récupérez un contact et le contexte de sa demande pour préparer la suite.", link: "Découvrir la capture", href: "/portail/capture", label: "Une demande exploitable", items: ["Nom et coordonnées", "Entreprise et besoin", "Forfait visé et message"] },
      { title: "Repérez ce qui freine vos ventes.", body: "Le diagnostic vous pose des questions sur votre volume de demandes et votre suivi. Il vous aide à identifier les points à améliorer avant de choisir les outils et le forfait adaptés à votre activité.", action: "Vous savez si votre priorité est de mieux capter les demandes ou de mieux les suivre.", link: "Essayer le diagnostic", href: "/diagnostic", label: "Un point de départ clair", items: ["Volume de demandes", "Qualité du suivi", "Priorités à travailler"] },
      { title: "Préparez la prochaine action.", body: "Dans les outils, préparez une relance, rédigez une soumission ou utilisez une liste de vérification. Les fonctions accessibles dépendent de votre forfait. Vous vérifiez le contenu avant de l’utiliser avec votre client.", action: "Vous passez du contact reçu à une réponse concrète, avec une offre et une prochaine étape.", link: "Explorer les outils", href: "/outils", label: "Un suivi structuré", items: ["Message de relance", "Soumission à vérifier", "Liste de suivi"] },
      { title: "Retrouvez vos accès dans le portail.", body: "Après l’abonnement, le portail regroupe les outils disponibles avec votre forfait et les demandes associées à votre compte. Il s’ouvre dans votre navigateur, sur ordinateur comme sur téléphone.", action: "Vous retrouvez vos accès et vos demandes sans changer de plateforme à chaque étape.", link: "Ouvrir le portail", href: "/portail", label: "Votre espace de travail", items: ["Forfait et outils accessibles", "Demandes du compte", "Accès web et mobile"] },
    ],
    example: "Exemple illustratif · aucune donnée client réelle", exampleTitle: "Une demande de soumission, du message à la prochaine action.", exampleBody: "Un prospect remplit le formulaire. Vous examinez son besoin, préparez une réponse, puis une soumission. Le dossier et vos outils vous donnent un point de repère pour le suivi.",
    statuses: ["Demande reçue", "Besoin précisé", "Offre préparée", "Suivi à faire"],
    exampleName: "Entreprise Exemple", exampleNeed: "Besoin : centraliser les demandes du site", exampleNext: "Prochaine action : confirmer le périmètre avant la soumission",
    activation: "Et pour commencer ?", activationBody: "Votre abonnement BlackWayConnect se souscrit séparément de vos ventes à vos propres clients.",
    onboarding: [
      ["Choisissez votre forfait", "Comparez les outils et le niveau d’accompagnement sur la page Forfaits."],
      ["Souscrivez en ligne", "Le paiement de l’abonnement est traité en ligne en dollars canadiens. L'accès est activé dès la confirmation du paiement."],
      ["Accédez au portail", "Une fois l’abonnement confirmé, les accès correspondant au forfait sont activés. Utilisez le portail pour retrouver vos outils."],
    ],
    faqTitle: "Les réponses avant de vous lancer.",
    faq: [
      ["Est-ce que tout se fait automatiquement ?", "La capture et l’activation des accès sont reliées au système. Les relances et soumissions restent des contenus que vous préparez et vérifiez. Les automatisations et l’accompagnement varient selon le forfait."],
      ["Est-ce que les mêmes outils sont inclus partout ?", "Non. Les accès dépendent du palier choisi. Consultez la comparaison des forfaits pour vérifier les outils dont vous avez besoin."],
      ["Puis-je l’utiliser sur mon téléphone ?", "Oui. Le portail web est accessible dans le navigateur mobile. Le Pack Cellulaire est une offre distincte; il n’est pas nécessaire pour ouvrir le portail web."],
      ["Que faire si je ne retrouve pas mes accès ?", "Ouvrez le portail avec le courriel associé à votre abonnement. Si le problème persiste, contactez le service client avec ce courriel et la référence de votre transaction."],
    ],
    cta: "Commencez par votre besoin.", ctaBody: "Faites le diagnostic pour définir vos priorités, ou comparez les forfaits si vous savez déjà ce qu’il vous faut.", contact: "Parler à BlackWay", result: "Ce que vous obtenez", illustration: "Illustration du parcours", tools: "Relance · Soumission · Liste de suivi",
  },
  en: {
    eyebrow: "BlackWayConnect · The workflow explained", title: "A request comes in. You know what to do next.",
    intro: "BlackWayConnect brings request capture, follow-up tools and the client portal together. Here is where to start, what to use and how to move forward, step by step.",
    start: "Run my diagnostic", plans: "Compare plans", caption: "Capture, follow-up and operations in one environment.",
    process: "From first contact to client follow-up.", processBody: "Every step has a clear purpose. You stay in control of replies, offers and decisions.",
    steps: [
      { title: "Receive the request in the right place.", body: "The website form and AI secretary collect the prospect’s details and needs. The portal also provides a capture tool to add a request yourself.", action: "You get a contact and the context you need to prepare the next step.", link: "Explore capture", href: "/portail/capture", label: "A useful request", items: ["Name and contact details", "Company and needs", "Preferred plan and message"] },
      { title: "Identify what slows your sales down.", body: "The diagnostic asks about your request volume and follow-up. It helps identify areas to improve before you select the tools and plan that fit your business.", action: "You can decide whether to focus on capturing more requests or following them up better.", link: "Try the diagnostic", href: "/diagnostic", label: "A clear starting point", items: ["Request volume", "Follow-up quality", "Priorities to work on"] },
      { title: "Prepare the next action.", body: "Use the tools to prepare a follow-up, write a quote or work through a checklist. Available features depend on your plan. Review the content before using it with your client.", action: "Turn the incoming contact into a concrete reply, an offer and a next step.", link: "Explore the tools", href: "/outils", label: "Structured follow-up", items: ["Follow-up message", "Quote to review", "Follow-up checklist"] },
      { title: "Find your access in the portal.", body: "After subscribing, the portal brings together the tools included in your plan and requests associated with your account. Open it in your browser on desktop or phone.", action: "Find your access and requests without switching platforms at each step.", link: "Open the portal", href: "/portail", label: "Your workspace", items: ["Plan and available tools", "Account requests", "Web and mobile access"] },
    ],
    example: "Illustrative example · no real client data", exampleTitle: "A quote request, from the message to the next action.", exampleBody: "A prospect fills in the form. You review their needs, prepare a reply and then a quote. The record and tools give you a reference point for follow-up.",
    statuses: ["Request received", "Needs clarified", "Offer prepared", "Follow-up needed"], exampleName: "Example Company", exampleNeed: "Need: centralize website requests", exampleNext: "Next action: confirm the scope before preparing a quote",
    activation: "How do you get started?", activationBody: "Your BlackWayConnect subscription is separate from sales to your own clients.",
    onboarding: [["Choose your plan", "Compare tools and support levels on the Plans page."], ["Subscribe online", "Subscription payments are processed online in Canadian dollars. Access is activated as soon as payment is confirmed’s terms."], ["Access the portal", "Once the subscription is confirmed, access for your plan is activated. Open the portal to find your tools."]],
    faqTitle: "Answers before you start.",
    faq: [["Does everything happen automatically?", "Capture and access activation are connected to the system. Follow-ups and quotes are content you prepare and review. Automations and support vary by plan."], ["Does every plan include the same tools?", "No. Access depends on your tier. Check the plan comparison for the tools you need."], ["Can I use it on my phone?", "Yes. The web portal works in your mobile browser. The Cellular Pack is a separate offer and is not required to open the web portal."], ["What if I cannot find my access?", "Open the portal with the email associated with your subscription. If the issue persists, contact support with that email and your transaction reference."]],
    cta: "Start with what you need.", ctaBody: "Run the diagnostic to set priorities, or compare plans if you already know what you need.", contact: "Talk to BlackWay", result: "What you get", illustration: "Workflow illustration", tools: "Follow-up · Quote · Checklist",
  },
};

export function HowItWorksPage() {
  const { lang, path } = useLang();
  const c = CONTENT[lang];
  return (
    <div className="how-page">
      <section className="how-intro shell" aria-labelledby="how-title">
        <div className="how-intro__copy">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 id="how-title">{c.title}</h1>
          <p className="lede">{c.intro}</p>
          <div className="cta-row">
            <Link className="btn btn--primary" to={path("/diagnostic")}>{c.start}</Link>
            <Link className="btn btn--ghost" to={path("/forfaits")}>{c.plans}</Link>
          </div>
        </div>
        <figure className="how-intro__image">
          <img src="/office-team.jpg" alt={lang === "fr" ? "Illustration d’un travail collaboratif autour de dossiers numériques" : "Illustration of collaborative work with digital records"} width={1536} height={1024} fetchPriority="high" />
          <figcaption>{c.caption}</figcaption>
        </figure>
      </section>

      <section className="how-process shell" aria-labelledby="how-process-title">
        <div className="how-section-head"><p className="eyebrow">{lang === "fr" ? "Le fonctionnement au quotidien" : "The everyday workflow"}</p><h2 id="how-process-title">{c.process}</h2><p>{c.processBody}</p></div>
        <ol className="how-process__steps">
          {c.steps.map((step, i) => (
            <li className="how-process__step" key={step.href}>
              <div className="how-process__copy">
                <span className="how-process__number">0{i + 1}</span>
                <h3>{step.title}</h3><p>{step.body}</p>
                <div className="how-result"><strong>{c.result}</strong><p>{step.action}</p></div>
                <Link className="how-text-link" to={path(step.href)}>{step.link}</Link>
              </div>
              <figure className="how-workspace">
                {i === 2 ? <img className="how-workspace__photo" src="/office-ops.jpg" alt={lang === "fr" ? "Illustration de préparation d’une offre à un bureau" : "Illustration of preparing an offer at a desk"} width={1536} height={1024} loading="lazy" /> : null}
                <figcaption>{c.illustration} · 0{i + 1}</figcaption>
                <div className="how-workspace__body"><p className="how-workspace__label">{step.label}</p>
                  <ul>{step.items.map((item, j) => <li key={item}><span className="how-workspace__mark" aria-hidden="true">{j + 1}</span>{item}</li>)}</ul>
                  <p className="how-workspace__note">{i === 2 ? c.tools : "BlackWayConnect · Grow Hub"}</p>
                </div>
              </figure>
            </li>
          ))}
        </ol>
      </section>

      <section className="how-example shell" aria-labelledby="how-example-title">
        <div className="how-section-head"><p className="eyebrow">{c.example}</p><h2 id="how-example-title">{c.exampleTitle}</h2><p>{c.exampleBody}</p></div>
        <div className="how-example__record"><div><strong>{c.exampleName}</strong><p>{c.exampleNeed}</p></div><p>{c.exampleNext}</p></div>
        <ol className="how-example__flow">{c.statuses.map((status, i) => <li key={status}><span>0{i + 1}</span><strong>{status}</strong></li>)}</ol>
      </section>

      <section className="how-onboarding shell" aria-labelledby="how-onboarding-title">
        <div className="how-section-head"><h2 id="how-onboarding-title">{c.activation}</h2><p>{c.activationBody}</p></div>
        <ol>{c.onboarding.map(([title, body], i) => <li key={title}><span className="how-process__number">0{i + 1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol>
      </section>

      <section className="how-faq shell" aria-labelledby="how-faq-title"><h2 id="how-faq-title">{c.faqTitle}</h2><div className="faq-list">{c.faq.map(([q, a]) => <details className="faq-item" key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
      <section className="how-final shell"><div><h2>{c.cta}</h2><p>{c.ctaBody}</p></div><div className="cta-row"><Link className="btn btn--primary" to={path("/diagnostic")}>{c.start}</Link><Link className="btn btn--ghost" to={path("/forfaits")}>{c.plans}</Link></div><p className="how-final__contact">{c.contact} : <a href={PHONES.tollFree.href}>{PHONES.tollFree.display}</a> · <a href={`mailto:${EMAILS.service}`}>{EMAILS.service}</a></p></section>
    </div>
  );
}