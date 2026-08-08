import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "./i18n";
import { appDeepLink } from "./appConfig";
import { checkoutUrl, PLANS, type PlanKey } from "./stripeConfig";
import { copy } from "./copy";
import {
  computeLeakScore,
  leakBand,
  recommendPlan,
  scoreCopy,
} from "./scoreCopy";
import { ShareBar } from "./ShareBar";

type Phase = "intro" | "quiz" | "result";

function useAnimatedScore(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return value;
}

export function RevenueLeakScore({ embedded = false }: { embedded?: boolean }) {
  const { lang, path } = useLang();
  const sc = scoreCopy[lang];
  const plans = copy[lang].plans;
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [plan, setPlan] = useState<PlanKey>("grow_hub_growth");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const animated = useAnimatedScore(score, phase === "result");
  const band = leakBand(score);
  const planMeta = plans.find((p) => p.key === plan)!;

  function selectOption(qid: string, oid: string) {
    const next = { ...answers, [qid]: oid };
    setAnswers(next);
    if (step < sc.questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      const s = computeLeakScore(next, sc.questions);
      const rec = recommendPlan(s, next);
      setScore(s);
      setPlan(rec);
      setPhase("result");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const prenom = String(fd.get("prenom") || "");
    const email = String(fd.get("email") || "");
    const entreprise = String(fd.get("entreprise") || "");
    // HubSpot enum bw_source allows form_web|portail|stripe|campagne|… — not custom tags.
    // Provenance stays in message; source=campagne keeps CRM valid.
    const summary = [
      "bw_source=revenue_leak_score",
      `score=${score}/100`,
      `band=${band}`,
      `plan=${plan}`,
      ...sc.questions.map((q) => {
        const opt = q.options.find((o) => o.id === answers[q.id]);
        return `${q.id}=${opt?.label || "?"}`;
      }),
    ].join(" | ");

    const payload = {
      prenom,
      nom: "",
      email,
      entreprise,
      telephone: "",
      message: summary.slice(0, 2000),
      forfait: plan,
      source: "campagne",
      urgence: score >= 65 ? "elevee" : "normal",
      langue: lang,
      bw_ref: "site",
      icp: "oui_pme",
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    } finally {
      setPending(false);
    }
  }

  function restart() {
    setPhase("intro");
    setStep(0);
    setAnswers({});
    setScore(0);
    setStatus("idle");
  }

  const q = sc.questions[step];
  const ring = Math.min(100, animated);
  const circumference = 2 * Math.PI * 54;
  const dash = (ring / 100) * circumference;

  return (
    <div className={`rls ${embedded ? "rls--embedded" : ""}`} id="revenue-leak-score">
      {phase === "intro" && (
        <div className={`rls__intro${embedded ? "" : " rls__intro--compact"}`}>
          {embedded ? (
            <>
              <p className="eyebrow">{sc.eyebrow}</p>
              <h2>{sc.title}</h2>
              <p className="lede">{sc.body}</p>
            </>
          ) : null}
          <button type="button" className="btn btn--primary" onClick={() => setPhase("quiz")}>
            {sc.start}
          </button>
        </div>
      )}

      {phase === "quiz" && q && (
        <div className="rls__quiz" key={q.id}>
          <div className="rls__progress" aria-hidden="true">
            <span style={{ width: `${((step + 1) / sc.questions.length) * 100}%` }} />
          </div>
          <p className="rls__step">
            {step + 1} {sc.of} {sc.questions.length}
          </p>
          <h3 className="rls__prompt">{q.prompt}</h3>
          <div className="rls__options">
            {q.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="rls__option"
                onClick={() => selectOption(q.id, opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {step > 0 ? (
            <button
              type="button"
              className="btn btn--ghost"
              style={{ marginTop: "1rem" }}
              onClick={() => setStep((s) => s - 1)}
            >
              {sc.back}
            </button>
          ) : null}
        </div>
      )}

      {phase === "result" && (
        <div className="rls__result" ref={resultRef}>
          <p className="eyebrow">{sc.resultEyebrow}</p>
          <div className="rls__score-wrap">
            <svg className="rls__ring" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="54" className="rls__ring-track" />
              <circle
                cx="60"
                cy="60"
                r="54"
                className="rls__ring-value"
                style={{ strokeDasharray: `${dash} ${circumference}` }}
              />
            </svg>
            <div className="rls__score-num">
              <strong>{animated}</strong>
              <span>{sc.scoreLabel}</span>
            </div>
          </div>
          <p className="rls__band">
            {band === "low" ? sc.leakLow : band === "mid" ? sc.leakMid : sc.leakHigh}
          </p>
          <ul className="point-list">
            {sc.diagnoses[band].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="rls__rec">
            <p className="eyebrow">{planMeta.name}</p>
            <p className="price">{planMeta.price}</p>
            <p>
              <strong>{sc.why} — </strong>
              {sc.planWhy[plan]}
            </p>
          </div>

          <div className="rls__save">
            <h3>{sc.saveTitle}</h3>
            <p>{sc.saveBody}</p>
            <form className="form" onSubmit={onSave}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="rls-prenom">{sc.first}</label>
                  <input id="rls-prenom" name="prenom" required autoComplete="given-name" />
                </div>
                <div className="field">
                  <label htmlFor="rls-email">{sc.email}</label>
                  <input id="rls-email" name="email" type="email" required autoComplete="email" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="rls-co">{sc.company}</label>
                <input id="rls-co" name="entreprise" autoComplete="organization" />
              </div>
              <button className="btn btn--primary" type="submit" disabled={pending || status === "ok"}>
                {pending ? sc.saving : sc.saveCta}
              </button>
              {status === "ok" && <p className="form-status form-status--ok">{sc.saved}</p>}
              {status === "err" && <p className="form-status form-status--err">{sc.saveError}</p>}
            </form>
          </div>

          <div className="cta-row" style={{ marginTop: "1.5rem" }}>
            <a
              className="btn btn--primary"
              href={checkoutUrl(plan, { lang, source: "revenue_leak_score", content: "result_subscribe" })}
              rel="noopener noreferrer"
              target="_blank"
            >
              {sc.subscribe}
            </a>
            <Link
              className="btn btn--ghost"
              to={`${path("/grow-hub")}?score=${score}&plan=${plan}`}
            >
              {sc.seeGrowHub}
            </Link>
            <a
              className="btn btn--ghost"
              href={appDeepLink({
                lang,
                campaign: "revenue_leak_score",
                content: plan,
                forfait: plan,
              })}
              rel="noopener noreferrer"
              target="_blank"
            >
              {sc.openApp}
            </a>
            <button type="button" className="btn btn--ghost" onClick={restart}>
              {sc.restart}
            </button>
          </div>
          <ShareBar variant="diagnostic" compact className="share-bar--result" />
          <p className="rls__hint">
            {PLANS[plan].amountCad}$ CAD · Stripe Checkout
          </p>
        </div>
      )}
    </div>
  );
}
