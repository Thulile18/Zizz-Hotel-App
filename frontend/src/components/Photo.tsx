import { useState } from 'react';

// Shows a photo. If the file is missing it tries a fallback photo, then shows a plain block.
export default function Photo({
  src,
  fallback,
  alt,
  className,
}: {
  src?: string | null;
  fallback?: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(src ?? fallback ?? null);
  const [hidden, setHidden] = useState(false);

  if (!url || hidden) return <div className={className} />;

  return (
    <img
      className={className}
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (fallback && url !== fallback) setUrl(fallback);
        else setHidden(true);
      }}
    />
  );
}
