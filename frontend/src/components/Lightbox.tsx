import { useEffect, useRef, useState } from 'react';

export interface LightboxImage {
  url: string;
  caption: string | null;
  category: string | null;
}

// Full-screen photo viewer: arrow keys, swipe, thumbnails and Esc to close
export default function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const total = images.length;
  const [index, setIndex] = useState(startIndex);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % total);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + total) % total);
    }
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, total]);

  if (total === 0) return null;
  const current = images[index % total];

  const next = () => setIndex((i) => (i + 1) % total);
  const previous = () => setIndex((i) => (i - 1 + total) % total);

  return (
    <div
      className="v-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button ref={closeRef} className="v-lb-close" onClick={onClose} aria-label="Close gallery">
        ✕
      </button>

      {total > 1 && (
        <button className="v-lb-nav v-lb-prev" onClick={previous} aria-label="Previous photo">
          ‹
        </button>
      )}

      <figure
        className="v-lb-stage"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (delta > 50) previous();
          if (delta < -50) next();
        }}
      >
        <img key={current.url} className="v-lb-img" src={current.url} alt={current.caption ?? 'Hotel photo'} />
        <figcaption>
          {current.category && <span className="eyebrow">{current.category}</span>}
          {current.caption && <span className="v-lb-caption">{current.caption}</span>}
          <span className="v-lb-count">
            {index % total + 1} / {total}
          </span>
        </figcaption>
      </figure>

      {total > 1 && (
        <button className="v-lb-nav v-lb-next" onClick={next} aria-label="Next photo">
          ›
        </button>
      )}

      {total > 1 && (
        <div className="v-lb-thumbs">
          {images.map((img, i) => (
            <button
              key={img.url}
              className={`v-lb-thumb${i === index % total ? ' on' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
            >
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
