import Image from 'next/image';
import { useEffect, useState } from 'react';

import {
  resolveBurgerImageUrl,
  resolveBurgerImageUrlSync,
} from 'libs/burgerPhotoRefs';

const LAYOUT = {
  cardCompact: {
    fill: true,
    sizes: '(max-width: 1024px) 50vw, 25vw',
  },
  cardFull: {
    fill: true,
    sizes: '(max-width: 1024px) 100vw, 35vw',
  },
  featured: {
    fill: true,
    sizes: '(max-width: 1024px) 100vw, 66vw',
  },
  detail: {
    fill: true,
    sizes: '(max-width: 768px) 100vw, 672px',
  },
} as const;

type Layout = keyof typeof LAYOUT;

type Props = {
  src: string;
  alt: string;
  layout: Layout;
  priority?: boolean;
  className?: string;
};

function BurgerPhoto({
  src,
  alt,
  layout,
  priority = false,
  className = 'object-cover',
}: Readonly<Props>) {
  const { fill, sizes } = LAYOUT[layout];
  const [resolvedSrc, setResolvedSrc] = useState(
    () => resolveBurgerImageUrlSync(src) ?? undefined
  );

  useEffect(() => {
    const immediate = resolveBurgerImageUrlSync(src);
    if (immediate) {
      setResolvedSrc(immediate);
      return;
    }

    let cancelled = false;
    void resolveBurgerImageUrl(src).then((url) => {
      if (!cancelled) {
        setResolvedSrc(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!resolvedSrc) {
    return null;
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      fetchPriority={priority ? 'high' : 'low'}
      className={className}
    />
  );
}

export default BurgerPhoto;
