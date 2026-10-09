import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Junta classes ignorando valores vazios. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-gold-500 text-coal-950 hover:bg-gold-400 font-semibold",
  secondary: "border border-coal-600 bg-coal-800 text-bone-50 hover:border-gold-500/60 hover:bg-coal-700",
  ghost: "text-bone-200 hover:bg-coal-800 hover:text-bone-50",
  danger: "border border-blood-500/40 text-blood-400 hover:bg-blood-500/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
    "disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function LinkButton({ variant = "secondary", size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

const fieldClasses = cn(
  "w-full rounded-md border border-coal-600 bg-coal-900 px-3 py-2 text-sm text-bone-50",
  "placeholder:text-bone-500 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClasses, "h-10", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldClasses, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClasses, "min-h-20", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-medium text-bone-200">{label}</span>
      {children}
      {hint && <span className="text-xs text-bone-500">{hint}</span>}
    </label>
  );
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-xl border border-coal-700 bg-coal-900/80 p-5 shadow-lg shadow-black/20", className)}
      {...props}
    />
  );
}

export function CardTitle({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <header className="mb-4">
      <h2 className="font-display text-lg font-bold tracking-wide text-bone-50">{children}</h2>
      {description && <p className="mt-1 text-sm text-bone-400">{description}</p>}
    </header>
  );
}

type BadgeTone = "gold" | "green" | "red" | "neutral";

const badgeTones: Record<BadgeTone, string> = {
  gold: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  green: "border-moss-400/40 bg-moss-400/10 text-moss-400",
  red: "border-blood-500/40 bg-blood-500/10 text-blood-400",
  neutral: "border-coal-600 bg-coal-800 text-bone-400",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", badgeTones[tone])}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-bone-50 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-bone-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-coal-600 px-4 py-8 text-center text-sm text-bone-400">
      {children}
    </p>
  );
}
