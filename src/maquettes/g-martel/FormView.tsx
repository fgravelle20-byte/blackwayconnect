import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { PropertyType, RequestIntent, UrgencyLevel, WorkType } from "../types";
import { useGMartel } from "./context";
import {
  INTENT_COPY,
  PROPERTY_OPTIONS,
  URGENCY_OPTIONS,
  WORK_OPTIONS,
  ZONE_OPTIONS,
  callbackFor,
} from "./copy";

function parseIntent(raw: string | null): RequestIntent {
  if (raw === "urgence" || raw === "rappel" || raw === "soumission") return raw;
  return "soumission";
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function readPhoto(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const max = 900;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readAsDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return readAsDataUrl(file);
  }
}

export function FormView() {
  const [params] = useSearchParams();
  const intent = parseIntent(params.get("intent"));
  const copy = INTENT_COPY[intent];
  const navigate = useNavigate();
  const { addRequest } = useGMartel();

  const [propertyType, setPropertyType] = useState<PropertyType>("residentiel");
  const [workType, setWorkType] = useState<WorkType>(intent === "urgence" ? "panne" : "borne");
  const [urgency, setUrgency] = useState<UrgencyLevel>(intent === "urgence" ? "now" : "standard");
  const [zone, setZone] = useState("Vaudreuil-Dorion");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lockedUrgency = intent === "urgence";

  const previewHint = useMemo(() => callbackFor(urgency, intent), [urgency, intent]);

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUrl(await readPhoto(file));
    } catch {
      setError("Impossible de lire la photo. Réessayez avec une image plus légère.");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const created = addRequest({
      intent,
      propertyType,
      workType,
      urgency: lockedUrgency ? "now" : urgency,
      zone,
      name: name.trim() || "Propriétaire",
      phone: phone.trim() || "À confirmer",
      description: description.trim() || "Demande envoyée depuis le centre de demandes.",
      photoUrl,
      callbackEta: callbackFor(lockedUrgency ? "now" : urgency, intent),
    });
    navigate(`/maquettes/g-martel/confirmation?id=${created.id}`);
  }

  return (
    <form className="gm-form" onSubmit={onSubmit}>
      <Link className="gm-back" to="/maquettes/g-martel">
        ← Accueil
      </Link>
      <h1>{copy.title}</h1>
      <p>{copy.lead}</p>

      <div className="gm-field">
        <span>Type de propriété</span>
        <div className="gm-chips" role="group" aria-label="Type de propriété">
          {PROPERTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="gm-chip"
              aria-pressed={propertyType === opt.value}
              onClick={() => setPropertyType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gm-field">
        <label htmlFor="gm-work">Nature du travail</label>
        <select id="gm-work" value={workType} onChange={(e) => setWorkType(e.target.value as WorkType)}>
          {WORK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="gm-field">
        <span>Niveau d’urgence</span>
        <div className="gm-chips" role="group" aria-label="Niveau d’urgence">
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="gm-chip"
              aria-pressed={urgency === opt.value}
              disabled={lockedUrgency && opt.value !== "now"}
              onClick={() => setUrgency(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gm-field">
        <label htmlFor="gm-zone">Zone desservie</label>
        <select id="gm-zone" value={zone} onChange={(e) => setZone(e.target.value)}>
          {ZONE_OPTIONS.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      <div className="gm-field">
        <label htmlFor="gm-name">Nom</label>
        <input id="gm-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </div>

      <div className="gm-field">
        <label htmlFor="gm-phone">Téléphone</label>
        <input
          id="gm-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          required
        />
      </div>

      <div className="gm-field">
        <label htmlFor="gm-desc">Description</label>
        <textarea
          id="gm-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={intent === "urgence" ? "Ex. : disjoncteur qui saute, une partie de la maison sans courant." : "Décrivez le travail souhaité."}
          required
        />
      </div>

      <div className="gm-field gm-photo">
        <label htmlFor="gm-photo">Photos</label>
        <input id="gm-photo" type="file" accept="image/*" capture="environment" onChange={onPhoto} />
        {photoUrl ? <img src={photoUrl} alt="Aperçu de la photo jointe" width={320} height={140} /> : null}
      </div>

      <p>Confirmation prévue : {previewHint}</p>
      {error ? <p>{error}</p> : null}

      <button className="gm-btn gm-btn--quote" type="submit" disabled={pending}>
        {copy.submit}
      </button>
    </form>
  );
}
