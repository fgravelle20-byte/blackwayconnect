import type { StudioState } from "./types";

type Props = { state: StudioState };

export function InboxView({ state }: Props) {
  const leads = [...state.leads].sort((a, b) => b.createdAt - a.createdAt);
  const convos = [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="vx-inbox">
      <section>
        <h2>Leads capturés ({state.chatbot.leads_captures})</h2>
        {leads.length === 0 ? (
          <p className="vx-inbox__empty">Aucun lead pour l’instant. Testez le widget sur l’aperçu site.</p>
        ) : (
          <ul>
            {leads.map((lead) => (
              <li key={lead.id} className={lead.urgence ? "vx-inbox__lead vx-inbox__lead--hot" : "vx-inbox__lead"}>
                <div>
                  <strong>{lead.nom}</strong>
                  <p>
                    {lead.telephone}
                    {lead.courriel ? ` · ${lead.courriel}` : ""}
                  </p>
                </div>
                <p>{lead.besoin}</p>
                <time dateTime={new Date(lead.createdAt).toISOString()}>
                  {new Date(lead.createdAt).toLocaleString("fr-CA")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2>Conversations ({state.chatbot.conversations_total})</h2>
        {convos.length === 0 ? (
          <p className="vx-inbox__empty">Pas encore de conversation.</p>
        ) : (
          <ul>
            {convos.map((c) => (
              <li key={c.id} className="vx-inbox__conv">
                <p>
                  {c.messages.filter((m) => m.role === "user").length} message
                  {c.messages.filter((m) => m.role === "user").length > 1 ? "s" : ""} visiteur
                  {c.leadId ? " · lead capturé" : ""}
                </p>
                <blockquote>{c.messages.at(-1)?.content}</blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
