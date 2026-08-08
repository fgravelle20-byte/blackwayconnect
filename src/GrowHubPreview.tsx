import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "./i18n";
import { copy } from "./copy";
import { checkoutUrl, PLANS, type PlanKey } from "./stripeConfig";
import {
  formatCad,
  growHubCopy,
  parsePlanParam,
  planFromScore,
  SAMPLE_DEALS,
  STAGE_ORDER,
  type SampleDeal,
  type StageId,
} from "./growHubCopy";

type DealState = SampleDeal & { stage: StageId };

function nextStage(stage: StageId): StageId | null {
  const i = STAGE_ORDER.indexOf(stage);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1];
}

export function GrowHubPreview() {
  const { lang } = useLang();
  const gh = growHubCopy[lang];
  const plans = copy[lang].plans;
  const [params] = useSearchParams();
  const scoreRaw = params.get("score");
  const score = scoreRaw && !Number.isNaN(Number(scoreRaw)) ? Math.min(100, Math.max(0, Number(scoreRaw))) : null;
  const planFromQuery = parsePlanParam(params.get("plan"));
  const recommended: PlanKey = planFromQuery || (score != null ? planFromScore(score) : "grow_hub_growth");
  const planMeta = plans.find((p) => p.key === recommended)!;

  const [deals, setDeals] = useState<DealState[]>(() => SAMPLE_DEALS.map((d) => ({ ...d })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [interacted, setInteracted] = useState<{ deal?: string; stage?: StageId }>({});
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const selected = deals.find((d) => d.id === selectedId) || null;
  const pipelineTotal = useMemo(() => deals.reduce((sum, d) => sum + d.value, 0), [deals]);

  function openDeal(id: string) {
    const deal = deals.find((d) => d.id === id);
    setSelectedId(id);
    if (deal) setInteracted({ deal: deal.company, stage: deal.stage });
  }

  function advanceDeal(id: string) {
    const current = deals.find((d) => d.id === id);
    if (!current) return;
    const n = nextStage(current.stage);
    if (!n) return;
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage: n } : d)));
    setInteracted({ deal: current.company, stage: n });
    setFlashId(id);
    window.setTimeout(() => setFlashId(null), 700);
  }

  async function onCapture(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const prenom = String(fd.get("prenom") || "");
    const email = String(fd.get("email") || "");
    const entreprise = String(fd.get("entreprise") || "");
    const summary = [
      "bw_source=grow_hub_preview",
      `plan=${recommended}`,
      score != null ? `score=${score}/100` : null,
      interacted.deal ? `deal=${interacted.deal}` : null,
      interacted.stage ? `stage=${interacted.stage}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const payload = {
      prenom,
      nom: "",
      email,
      entreprise,
      telephone: "",
      message: summary.slice(0, 2000),
      forfait: recommended,
      source: "campagne",
      urgence: score != null && score >= 65 ? "elevee" : "normal",
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

  return (
    <div className={`ghp ${mounted ? "ghp--ready" : ""}`}>
      <header className="ghp__hero">
        <p className="eyebrow">{gh.eyebrow}</p>
        <h1 className="display ghp__title">{gh.title}</h1>
        <p className="lede">
          {score != null ? gh.bodyFromScore(score, planMeta.name) : gh.body}
        </p>
        <p className="ghp__hint">{gh.demoHint}</p>
        <div className="ghp__stats" aria-label={gh.pipelineLabel}>
          <div>
            <span>{gh.pipelineLabel}</span>
            <strong>{gh.dealCount(deals.length)}</strong>
          </div>
          <div>
            <span>{gh.pipelineValue}</span>
            <strong>{formatCad(pipelineTotal, lang)}</strong>
          </div>
        </div>
      </header>

      <div className="ghp__layout">
        <div className="ghp__board-wrap">
          <div className="ghp__board" role="list">
            {STAGE_ORDER.map((stageId, si) => {
              const columnDeals = deals.filter((d) => d.stage === stageId);
              return (
                <section
                  key={stageId}
                  className="ghp__column"
                  style={{ animationDelay: `${si * 70}ms` }}
                  aria-label={gh.stages[stageId]}
                >
                  <header className="ghp__column-head">
                    <h2>{gh.stages[stageId]}</h2>
                    <span>{columnDeals.length}</span>
                  </header>
                  <div className="ghp__cards">
                    {columnDeals.map((deal, di) => (
                      <button
                        key={deal.id}
                        type="button"
                        role="listitem"
                        className={`ghp__card ${selectedId === deal.id ? "is-active" : ""} ${flashId === deal.id ? "is-flash" : ""}`}
                        style={{ animationDelay: `${si * 70 + di * 55}ms` }}
                        onClick={() => openDeal(deal.id)}
                      >
                        <span className="ghp__card-co">{deal.company}</span>
                        <span className="ghp__card-title">{deal.title[lang]}</span>
                        <span className="ghp__card-val">{formatCad(deal.value, lang)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="ghp__side">
          <div className="ghp__panel">
            <p className="eyebrow">{gh.thisIsYours}</p>
            <p className="ghp__panel-body">{gh.thisIsYoursBody}</p>

            <div className={`ghp__plan ${recommended ? "is-recommended" : ""}`}>
              <div className="ghp__plan-top">
                <span className="ghp__rec-badge">{gh.recommended}</span>
                <h3>{planMeta.name}</h3>
                <p className="price">{planMeta.price}</p>
              </div>
              <p>{gh.planWhy[recommended]}</p>
              <a
                className="btn btn--primary ghp__activate"
                href={checkoutUrl(recommended, {
                  lang,
                  source: "grow_hub_preview",
                  content: score != null ? `score_${score}` : "board_activate",
                })}
                rel="noopener noreferrer"
                target="_blank"
              >
                {gh.activate}
              </a>
              <p className="ghp__hint-sm">
                {PLANS[recommended].amountCad}$ CAD · Stripe Checkout
              </p>
            </div>

            <div className="ghp__tiers">
              {plans.map((p) => (
                <a
                  key={p.key}
                  className={`ghp__tier ${p.key === recommended ? "is-on" : ""}`}
                  href={checkoutUrl(p.key, {
                    lang,
                    source: "grow_hub_preview",
                    content: "tier_rail",
                  })}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>{p.name}</span>
                  <strong>{p.price}</strong>
                </a>
              ))}
            </div>
          </div>

          <div className="ghp__panel ghp__capture">
            <h3>{gh.captureTitle}</h3>
            <p>{gh.captureBody}</p>
            <form className="form" onSubmit={onCapture}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="ghp-prenom">{gh.first}</label>
                  <input id="ghp-prenom" name="prenom" required autoComplete="given-name" />
                </div>
                <div className="field">
                  <label htmlFor="ghp-email">{gh.email}</label>
                  <input id="ghp-email" name="email" type="email" required autoComplete="email" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ghp-co">{gh.company}</label>
                <input id="ghp-co" name="entreprise" autoComplete="organization" />
              </div>
              <button className="btn btn--ghost" type="submit" disabled={pending || status === "ok"}>
                {pending ? gh.saving : gh.softCta}
              </button>
              {status === "ok" && <p className="form-status form-status--ok">{gh.saved}</p>}
              {status === "err" && <p className="form-status form-status--err">{gh.saveError}</p>}
            </form>
          </div>
        </aside>
      </div>

      {selected && (
        <div className="ghp__drawer-root" role="presentation">
          <button
            type="button"
            className="ghp__backdrop"
            aria-label={gh.close}
            onClick={() => setSelectedId(null)}
          />
          <aside className="ghp__drawer" role="dialog" aria-modal="true" aria-label={gh.openDeal}>
            <header className="ghp__drawer-head">
              <div>
                <p className="eyebrow">{gh.stages[selected.stage]}</p>
                <h2>{selected.company}</h2>
                <p>{selected.title[lang]}</p>
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => setSelectedId(null)}>
                {gh.close}
              </button>
            </header>
            <dl className="ghp__meta">
              <div>
                <dt>{gh.value}</dt>
                <dd>{formatCad(selected.value, lang)}</dd>
              </div>
              <div>
                <dt>{gh.source}</dt>
                <dd>{selected.source[lang]}</dd>
              </div>
              <div>
                <dt>{gh.nextAction}</dt>
                <dd>{selected.next[lang]}</dd>
              </div>
            </dl>
            {nextStage(selected.stage) ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => advanceDeal(selected.id)}
              >
                {gh.advance} → {gh.stages[nextStage(selected.stage)!]}
              </button>
            ) : (
              <p className="ghp__won-note">{gh.advanced}</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
