import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-surface text-surface-foreground shadow-card p-7">
          <div className="mb-5 flex justify-center">
            <Logo />
          </div>
          {title && (
            <h1 className="text-center text-lg font-semibold text-surface-foreground">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
          <div className="mt-6 space-y-4">{children}</div>
          {footer && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BrandInput({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full rounded-xl border border-border bg-input/40 px-3 py-3 text-sm text-surface-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 ${
          icon ? "pl-10" : ""
        }`}
      />
    </div>
  );
}

export function BrandButton({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
}) {
  const base =
    "w-full rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-brand text-primary-foreground shadow-glow hover:opacity-95"
      : "border border-border bg-transparent text-surface-foreground hover:bg-muted";
  return (
    <button {...props} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
