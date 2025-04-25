import { useState, useEffect } from "react";
import Image from "next/image";

interface CandidateImageProps {
  clerkUserId: string | null;
  publicPhoto?: string | null;
  name: string;
  width?: number;
  height?: number;
}

const getInitialSrc = (photo?: string | null): string => {
  return photo || "/default-profile.png";
};

export function CandidateImage({
  clerkUserId,
  publicPhoto = null,
  name,
  width = 64,
  height = 64,
}: CandidateImageProps) {
  console.log("CandidateImage", { clerkUserId, publicPhoto, name });
  const [imgSrc, setImgSrc] = useState<string>(getInitialSrc(publicPhoto));

  useEffect(() => {
    async function loadPhoto() {
      if (!clerkUserId) return;
      try {
        const res = await fetch(`/api/photos?uploadedBy=${clerkUserId}`);
        if (res.ok) {
          const list: { url: string }[] = await res.json();
          if (list.length > 0 && list[0].url) {
            setImgSrc(getInitialSrc(list[0].url));
          } else {
            setImgSrc(getInitialSrc(publicPhoto));
          }
        } else {
          setImgSrc(getInitialSrc(publicPhoto));
        }
      } catch {
        // Handle error silently
        console.error("Error fetching photo:", clerkUserId);
        // Fallback to publicPhoto or default image
        setImgSrc(getInitialSrc(publicPhoto));
      }
    }
    loadPhoto();
  }, [clerkUserId, publicPhoto]);

  return (
    <Image
      src={imgSrc}
      alt={`${name}'s photo`}
      width={width}
      height={height}
      unoptimized
      className="rounded-full object-cover shadow-md aspect-square"
      style={{ aspectRatio: "1 / 1" }}
      onError={() => {
        if (imgSrc !== "/default-profile.png") {
          setImgSrc("/default-profile.png");
        }
      }}
    />
  );
}
