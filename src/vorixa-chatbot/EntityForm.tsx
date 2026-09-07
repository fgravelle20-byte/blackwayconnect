import { OBJECTIFS } from "./types";
import { buildEmbedCode } from "./config";
import type { StudioState, VorixaChatbot } from "./types";

type Props = {
  state: StudioState;
  onChange: (chatbot: VorixaChatbot) => void;
  onSubmit: () => void;
  savedAt: number | null;
};

export function EntityForm({ state, onChange, onSubmit, savedAt }: Props) {
  const bot = state.chatbot;
  const sourceOk = state.source.statut === "Entraîné";

  function set<K extends keyof VorixaChatbot>(key: K, value: VorixaChatbot[K]) {
    onChange({ ...bot, [key]: value });
  }

  return (
    <form
      className="vx-entity"
      onSubmit={(e) => {
        e.preventDefault();
        if (!bot.nom.trim()) return;
        onChange({ ...bot, embed_code: buildEmbedCode(bot.id) });
        onSubmit();
      }}
    >
      <header className="vx-entity__title">
        <div>
          <p className="vx-entity__kicker">Entité Base44</p>
          <h1>Modifier VorixaChatbot</h1>
        </div>
        {savedAt ? (
          <p className="vx-entity__saved">Enregistré {new Date(savedAt).toLocaleTimeString("fr-CA")}</p>
        ) : null}
      </header>

      <label>
        <span>website_id</span>
        <input value={bot.website_id} onChange={(e) => set("website_id", e.target.value)} autoComplete="off" />
      </label>

      <label>
        <span>
          nom<span className="vx-req">*</span>
        </span>
        <input required value={bot.nom} onChange={(e) => set("nom", e.target.value)} />
      </label>

      <label>
        <span>avatar_url</span>
        <input value={bot.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} />
      </label>

      <label>
        <span>couleur</span>
        <div className="vx-entity__color">
          <input
            type="color"
            aria-label="Couleur du widget"
            value={bot.couleur}
            onChange={(e) => set("couleur", e.target.value)}
          />
          <input value={bot.couleur} onChange={(e) => set("couleur", e.target.value)} />
        </div>
      </label>

      <label>
        <span>message_accueil</span>
        <textarea
          rows={4}
          value={bot.message_accueil}
          onChange={(e) => set("message_accueil", e.target.value)}
        />
      </label>

      <label>
        <span>
          objectif<span className="vx-req">*</span>
        </span>
        <select
          value={bot.objectif}
          onChange={(e) => set("objectif", e.target.value as VorixaChatbot["objectif"])}
        >
          {OBJECTIFS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <label className="vx-entity__check">
        <input
          type="checkbox"
          checked={bot.actif}
          onChange={(e) => set("actif", e.target.checked)}
          disabled={!bot.actif && !sourceOk}
        />
        <span>
          actif
          {!sourceOk ? " — une source entraînée est requise pour activer" : ""}
        </span>
      </label>

      <label>
        <span>conversations_total</span>
        <input readOnly value={bot.conversations_total} />
      </label>

      <label>
        <span>leads_captures</span>
        <input readOnly value={bot.leads_captures} />
      </label>

      <label>
        <span>embed_code</span>
        <textarea readOnly rows={3} value={bot.embed_code} />
        <small className="vx-entity__hint">
          Généré automatiquement. Sur vorixa.ca, coller le même script avec le vrai id Base44 de
          l’entité après Soumettre dans l’éditeur.
        </small>
      </label>

      <button type="submit" className="vx-entity__submit">
        Soumettre
      </button>
    </form>
  );
}
