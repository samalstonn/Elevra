import { useState } from "react";
import Image from "next/image";

interface CandidateImageProps {
  photo?: string | null;
  name: string;
  width?: number;
  height?: number;
}

// Helper function to determine the initial image source
const getInitialSrc = (photo?: string | null): string => {
  if (photo && !photo.startsWith("/")) {
    return "/default-profile.png";
    }
  return photo || "/default-profile.png";
};

export function CandidateImage({ photo, name, width = 64, height = 64 }: CandidateImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(getInitialSrc(photo));

  return (
    <Image
      src={imgSrc}
      alt={`${name}'s photo`}
      width={width}
      height={height}
      className="rounded-full object-cover shadow-md"
      onError={() => {
        if (imgSrc !== "/default-profile.png") {
          setImgSrc("/default-profile.png");
        }
      }}
    />
  );
}