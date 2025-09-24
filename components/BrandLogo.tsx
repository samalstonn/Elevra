import Image from "next/image";

type BrandLogoSize = "sm" | "md" | "lg";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: BrandLogoSize;
};

const SIZE_CLASS_MAP: Record<BrandLogoSize, string> = {
  sm: "h-16",
  md: "h-16",
  lg: "h-20",
};

export function BrandLogo({
  className,
  priority,
  size = "sm",
}: BrandLogoProps) {
  const classes = ["w-auto", SIZE_CLASS_MAP[size]];
  if (size === "sm") {
    classes.push("p-2");
  }
  if (className) {
    classes.push(className);
  }

  return (
    <Image
      src="/Elevra-thin.png"
      alt="Elevra logo"
      width={500}
      height={500}
      className={classes.join(" ")}
      priority={priority}
    />
  );
}
