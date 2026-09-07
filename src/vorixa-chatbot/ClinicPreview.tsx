import { CLINIC } from "./config";
import type { StudioState } from "./types";
import { ChatWidget, type ChatWidgetHandle } from "./ChatWidget";
import { type RefObject } from "react";

type Props = {
  state: StudioState;
  onState: (next: StudioState) => void;
  widgetRef: RefObject<ChatWidgetHandle | null>;
};

export function ClinicPreview({ state, onState, widgetRef }: Props) {
  return (
    <div className="av-site">
      <header className="av-site__top">
        <div className="av-site__brand">
          <span className="av-site__mark" aria-hidden="true" />
          <div>
            <strong>{CLINIC.brand}</strong>
            <p>Dentiste à Laval</p>
          </div>
        </div>
        <nav className="av-site__nav" aria-label="Aperçu">
          <a href="#soins">Soins</a>
          <a href="#equipe">Équipe</a>
          <a href={`tel:+1${CLINIC.phoneTel}`}>{CLINIC.phoneDisplay}</a>
        </nav>
      </header>

      <section className="av-site__hero">
        <p className="av-site__eyebrow">Laval · {CLINIC.address}</p>
        <h1>Un sourire soigné, une clinique qui rappelle.</h1>
        <p>
          Besoin d’un rendez-vous, d’une urgence ou d’un soin CEREC ? L’assistant Vorixa capture le
          besoin — nom et téléphone — pendant que vous consultez le site.
        </p>
        <div className="av-site__cta">
          <a className="av-site__btn" href={`tel:+1${CLINIC.phoneTel}`}>
            Appeler
          </a>
          <button
            type="button"
            className="av-site__btn av-site__btn--ghost"
            onClick={() => widgetRef.current?.open()}
          >
            Écrire à l’assistant
          </button>
        </div>
      </section>

      <section id="soins" className="av-site__grid">
        {["CEREC en une visite", "Urgence dentaire", "Aligneurs", "Implants"].map((item) => (
          <article key={item}>
            <h2>{item}</h2>
            <p>Décrivez le besoin dans le chat — la clinique vous rappelle. Aucun tarif inventé.</p>
          </article>
        ))}
      </section>

      <section id="equipe" className="av-site__hours">
        <div>
          <h2>Horaires</h2>
          <ul>
            {CLINIC.hours.map((h) => (
              <li key={h.day}>
                <span>{h.day}</span>
                <span>{h.hours}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Équipe</h2>
          <ul className="av-site__team">
            {CLINIC.team.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="av-site__foot">
        <p>
          {CLINIC.legal} · {CLINIC.address}, {CLINIC.cityLine} · {CLINIC.phoneDisplay}
        </p>
        <p>Aperçu Vorixa — widget réel de capture de leads, pas le site public de la clinique.</p>
      </footer>

      <ChatWidget ref={widgetRef} state={state} onState={onState} source="site" autoOpen />
    </div>
  );
}
