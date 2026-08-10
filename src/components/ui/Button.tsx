import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.scss";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button className={`tori-button tori-button--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
