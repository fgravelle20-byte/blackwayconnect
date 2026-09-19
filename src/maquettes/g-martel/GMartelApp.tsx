import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import type { ElectricalRequest } from "../types";
import { loadRequests, newRequestId, resetRequests, saveRequests, SEED_REQUESTS } from "../storage";
import { GMartelContext } from "./context";
import { callbackFor } from "./copy";
import { BoardView } from "./BoardView";
import { ConfirmView } from "./ConfirmView";
import { DossierView } from "./DossierView";
import { FormView } from "./FormView";
import { HomeView } from "./HomeView";
import { OfferView } from "./OfferView";
import "../maquettes.css";
import "./g-martel.css";

function viewFromPath(pathname: string): "home" | "form" | "confirm" | "board" | "offer" | "dossier" {
  if (pathname.includes("/demande")) return "form";
  if (pathname.includes("/confirmation")) return "confirm";
  if (pathname.includes("/tableau")) return "board";
  if (pathname.includes("/offre")) return "offer";
  if (pathname.includes("/dossier")) return "dossier";
  return "home";
}

function PhoneFrame({ evening, children }: { evening: boolean; children: ReactNode }) {
  const time = evening
    ? "21:14"
    : new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="gm-phone">
      <div className="gm-phone__status">
        <span>{time}</span>
        <span>5G</span>
      </div>
      <div className="gm-phone__body">{children}</div>
    </div>
  );
}

export function GMartelApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const view = viewFromPath(location.pathname);
  const [requests, setRequests] = useState<ElectricalRequest[]>(SEED_REQUESTS);
  const [ready, setReady] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<ElectricalRequest | null>(null);
  const [evening, setEvening] = useState(() => new URLSearchParams(location.search).get("soir") === "1");

  useEffect(() => {
    setRequests(loadRequests());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveRequests(requests);
  }, [ready, requests]);

  const addRequest = useCallback(
    (
      partial: Omit<ElectricalRequest, "id" | "createdAt" | "status" | "source"> & {
        source?: ElectricalRequest["source"];
      },
    ) => {
      const created: ElectricalRequest = {
        ...partial,
        id: newRequestId(),
        createdAt: Date.now(),
        status: "new",
        source: partial.source ?? "live",
      };
      setLastRequest(created);
      setRequests((prev) => [created, ...prev]);
      setHighlightedId(created.id);
      return created;
    },
    [],
  );

  const playEveningJourney = useCallback(() => {
    setEvening(true);
    const created = addRequest({
      intent: "urgence",
      propertyType: "residentiel",
      workType: "panne",
      urgency: "now",
      zone: "Saint-Lazare",
      name: "Sophie Lavoie",
      phone: "450-555-0164",
      description: "Panne partielle ce soir, disjoncteur qui saute. Photo du panneau jointe.",
      photoUrl: "/maquettes/g-martel/panel.jpg",
      callbackEta: callbackFor("now", "urgence"),
      source: "scenario",
    });
    navigate(`/maquettes/g-martel/confirmation?id=${created.id}&soir=1`);
    return created;
  }, [addRequest, navigate]);

  const resetDemo = useCallback(() => {
    setRequests(resetRequests());
    setHighlightedId(null);
    setLastRequest(null);
    setEvening(false);
    navigate("/maquettes/g-martel");
  }, [navigate]);

  const markCallbackSent = useCallback((id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "callback_sent" } : r)));
  }, []);

  const value = useMemo(
    () => ({
      requests,
      lastRequest,
      highlightedId,
      addRequest,
      playEveningJourney,
      resetDemo,
      markCallbackSent,
    }),
    [requests, lastRequest, highlightedId, addRequest, playEveningJourney, resetDemo, markCallbackSent],
  );

  const showPhone = view !== "offer" && view !== "dossier";
  const showBoard = view !== "offer" && view !== "dossier";
  const showOffer = view === "offer";
  const showDossier = view === "dossier";

  return (
    <GMartelContext.Provider value={value}>
      <div className="vx-demo gm">
        <div className="vx-chrome">
          <div className="vx-chrome__bar">
            <div className="vx-chrome__top">
              <Link className="vx-chrome__brand" to="/maquettes">
                VORIXA · Maquette 1 / 19
              </Link>
              <p className="vx-chrome__tag">
                Proposition de démonstration — pas un livrable déjà construit, ni une analyse technique
                complète, ni une promesse de résultats. Valider l’identité, le décideur et le besoin réel
                avant envoi.
              </p>
            </div>
            <div className="vx-chrome__nav">
              <NavLink to="/maquettes/g-martel" end>
                Accueil client
              </NavLink>
              <NavLink to="/maquettes/g-martel/demande?intent=urgence">Demande</NavLink>
              <NavLink to="/maquettes/g-martel/tableau">Tableau Guillaume</NavLink>
              <NavLink to="/maquettes/g-martel/offre">Offre</NavLink>
              <NavLink to="/maquettes/g-martel/dossier">Dossier CRM</NavLink>
            </div>
            <div className="vx-chrome__actions">
              <button type="button" onClick={playEveningJourney}>
                Jouer le parcours du soir
              </button>
              <button type="button" onClick={resetDemo}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <div
          className={`gm-stage${showOffer || showDossier ? "" : " gm-stage--split"}${
            view === "board" ? " gm-stage--board" : ""
          }`}
        >
          {showPhone ? (
            <PhoneFrame evening={evening}>
              {view === "form" ? <FormView /> : null}
              {view === "confirm" ? <ConfirmView /> : null}
              {view === "home" || view === "board" ? <HomeView evening={evening} /> : null}
            </PhoneFrame>
          ) : null}

          {showBoard ? (
            <div>
              {view !== "board" ? (
                <div className="gm-side" style={{ minHeight: "auto", marginBottom: "0.85rem" }}>
                  <h2>Parcours démontré</h2>
                  <p>
                    Un propriétaire voit la publicité ou arrive sur le site le soir. Il choisit « urgence »,
                    laisse une courte description et une photo. Il reçoit immédiatement une confirmation avec
                    le délai de rappel. Guillaume reçoit une notification avec toutes les informations déjà
                    triées, plutôt qu’un courriel vague ou un appel manqué.
                  </p>
                </div>
              ) : null}
              <BoardView />
            </div>
          ) : null}

          {showOffer ? <OfferView /> : null}
          {showDossier ? <DossierView /> : null}
        </div>
      </div>
    </GMartelContext.Provider>
  );
}
