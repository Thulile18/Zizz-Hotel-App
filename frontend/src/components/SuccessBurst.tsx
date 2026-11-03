import type { CSSProperties } from 'react';

// An animated gold tick with sparks. Shown as a pop-up, or inline inside a card.
export default function SuccessBurst({
  title,
  text,
  onClose,
  inline = false,
}: {
  title: string;
  text: string;
  onClose?: () => void;
  inline?: boolean;
}) {
  const card = (
    <div className={`v-thanks-card${inline ? ' v-thanks-inline' : ''}`}>
      <div className="v-burst" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle className="v-burst-ring" cx="60" cy="60" r="44" />
          <path className="v-burst-check" d="M38 62 l16 16 l30 -34" />
        </svg>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="v-spark" style={{ '--a': `${i * 30}deg` } as CSSProperties} />
        ))}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {onClose && (
        <button className="v-btn v-btn-sm" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );

  if (inline) return card;

  return (
    <div className="v-thanks" role="status" aria-live="polite" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{card}</div>
    </div>
  );
}
