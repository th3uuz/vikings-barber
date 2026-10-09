import { cn } from "./ui";

/** Elmo viking desenhado em SVG, usado como logo e favicon. */
export function HelmetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M17 34C9 31 5 22 7 9c3 9 8 13 15 15z" fill="#f6f1e7" />
      <path d="M47 34c8-3 12-12 10-25-3 9-8 13-15 15z" fill="#f6f1e7" />
      <path d="M15 37c0-12 7-20 17-20s17 8 17 20z" fill="#c99740" />
      <path d="M32 17v20" stroke="#a47a2f" strokeWidth="3" />
      <rect x="12" y="35" width="40" height="7" rx="2" fill="#a47a2f" />
      <rect x="29.5" y="41" width="5" height="13" rx="1.5" fill="#a47a2f" />
      <circle cx="18" cy="38.5" r="1.4" fill="#f0cd85" />
      <circle cx="25" cy="38.5" r="1.4" fill="#f0cd85" />
      <circle cx="39" cy="38.5" r="1.4" fill="#f0cd85" />
      <circle cx="46" cy="38.5" r="1.4" fill="#f0cd85" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <HelmetIcon className={compact ? "size-8" : "size-8 sm:size-10"} />
      <span
        className={cn(
          "font-display font-bold leading-none tracking-[0.12em] whitespace-nowrap text-bone-50",
          compact ? "text-base" : "text-base sm:text-xl",
        )}
      >
        VIKINGS <span className="text-gold-400">BARBER</span>
      </span>
    </span>
  );
}
