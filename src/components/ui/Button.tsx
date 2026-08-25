import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-gold text-pitch-dark shadow-md hover:bg-gold-dark hover:shadow-lg": variant === "primary",
          "border border-white/20 bg-white/10 text-white hover:bg-white/15": variant === "secondary",
          "bg-transparent text-white/80 hover:bg-white/10 hover:text-white": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
