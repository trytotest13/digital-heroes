"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
  variant?: "link" | "button" | "header";
}

export function BackButton({
  href,
  label = "Back",
  className = "",
  variant = "link",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (!href) {
      e.preventDefault();
      router.back();
    }
  };

  const arrowIcon = (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );

  let baseClasses = "group inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-pine";
  if (variant === "button") {
    baseClasses = "btn btn-outline btn-sm group inline-flex items-center gap-1.5";
  } else if (variant === "header") {
    baseClasses = "btn btn-ghost btn-sm text-cream hover:bg-ink-border group inline-flex items-center gap-1.5";
  }

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${className}`}>
        {arrowIcon}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={`${baseClasses} ${className}`}>
      {arrowIcon}
      <span>{label}</span>
    </button>
  );
}
