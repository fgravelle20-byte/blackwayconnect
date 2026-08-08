import { useLang } from "./i18n";
import { CinematicMedia } from "./CinematicMedia";

const frames = [
  { src: "/office-morning.jpg", key: "morning" as const },
  { src: "/office-team.jpg", key: "team" as const },
  { src: "/office-ops.jpg", key: "ops" as const },
];

/** “Journée au bureau” — cinematic stills until office-day.mp4 lands. */
export function OfficeDay() {
  const { t } = useLang();
  const o = t.office;

  return (
    <section className="section section--office" id="bureau" aria-labelledby="office-title">
      <div className="shell">
        <div className="section__head section__head--wide">
          <p className="eyebrow">{o.eyebrow}</p>
          <h2 id="office-title">{o.title}</h2>
          <p>{o.body}</p>
        </div>
      </div>

      <div className="office-stage">
        <CinematicMedia
          className="office-stage__media"
          videoSrc="/office-day.mp4"
          fallbackVideoSrc="/hero.mp4"
          poster="/office-morning.jpg"
          stills={frames.map((f) => f.src)}
        />
        <div className="shell office-stage__caption">
          <ol className="office-beats">
            {frames.map((f) => (
              <li key={f.key}>
                <span className="office-beats__label">{o.beats[f.key].label}</span>
                <strong>{o.beats[f.key].title}</strong>
                <p>{o.beats[f.key].body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
