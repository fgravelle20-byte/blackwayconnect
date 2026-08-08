import { useState } from "react";

type Props = {
  src: string;
  title: string;
  body: string;
  alt?: string;
  /** Hide entirely if the asset 404s (optional slots). */
  optional?: boolean;
  className?: string;
  width?: number;
  height?: number;
};

/** Photo + professional caption; optional assets disappear if missing. */
export function PhotoFigure({
  src,
  title,
  body,
  alt = "",
  optional = false,
  className = "",
  width = 1600,
  height = 900,
}: Props) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <figure className={`photo-fig${className ? ` ${className}` : ""}`}>
      <div className="photo-fig__media">
        <img
          src={src}
          alt={alt || title}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (optional) setVisible(false);
          }}
        />
      </div>
      <figcaption className="photo-fig__cap">
        <strong>{title}</strong>
        <p>{body}</p>
      </figcaption>
    </figure>
  );
}
