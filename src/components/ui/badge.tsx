import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "primary" | "pink" | "success" | "danger" | "warning" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[#eeeafe] text-[var(--primary)]",
  primary: "bg-[#eeeafe] text-[var(--primary)]",
  pink: "bg-[#ffe8f8] text-[var(--pink)]",
  success: "bg-[#e7f9ef] text-[#13a251]",
  danger: "bg-[#ffecea] text-[var(--danger)]",
  warning: "bg-[#fff5df] text-[var(--warning)]",
  info: "bg-[#e4f8ff] text-[#03a9e8]",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
