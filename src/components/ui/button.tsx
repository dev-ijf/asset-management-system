import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "outlinePink"
  | "success"
  | "danger"
  | "warning"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[#271093]",
  secondary: "border border-[var(--border)] bg-white text-[var(--text)] hover:bg-slate-50",
  outline: "border border-[var(--primary)] bg-white text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white",
  outlinePink: "border border-[var(--pink)] bg-white text-[var(--pink)] hover:bg-[var(--pink)] hover:text-white",
  success: "border border-[var(--success)] bg-[var(--success)] text-white hover:bg-[#1fb155]",
  danger: "border border-[var(--danger)] bg-[var(--danger)] text-white hover:bg-[#f04f46]",
  warning: "border border-[var(--warning)] bg-white text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white",
  ghost: "border border-transparent bg-transparent text-[var(--primary)] hover:bg-[var(--primary-soft)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
