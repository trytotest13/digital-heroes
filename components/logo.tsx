import Image from "next/image";
import Link from "next/link";

export interface LogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

export function Logo({
  href = "/",
  className = "",
  size = "md",
  inverted = false,
}: LogoProps) {
  const heightClasses = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
  };

  const img = (
    <Image
      src="/logo.png"
      alt="digital.HEROES."
      width={320}
      height={120}
      className={`${heightClasses[size]} w-auto object-contain ${inverted ? "brightness-0 invert" : ""} transition duration-200`}
      priority
    />
  );

  if (!href) {
    return <div className={`inline-flex items-center ${className}`}>{img}</div>;
  }

  return (
    <Link href={href} className={`inline-flex items-center transition hover:opacity-90 ${className}`}>
      {img}
    </Link>
  );
}
