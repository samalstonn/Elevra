"use client";

import Image, { ImageProps } from "next/image";
import { useMemo, useState } from "react";

type Props = Omit<ImageProps, "onError"> & {
  fallbackSrc?: string | string[];
};

export default function ImageWithFallback({
  fallbackSrc = "/default-image-college.png",
  src,
  alt,
  ...rest
}: Props) {
  const fallbacks = useMemo(
    () => (Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc]),
    [fallbackSrc]
  );
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={() => {
        if (fallbackIndex < fallbacks.length) {
          const next = fallbacks[fallbackIndex];
          setFallbackIndex(fallbackIndex + 1);
          setCurrentSrc(next as typeof src);
        }
      }}
    />
  );
}
