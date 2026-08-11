interface IconHamburgerProps {
  open: boolean;
  className?: string;
}

/** CSS morph hamburger; no animation library required. */
export function IconHamburger({ open, className = "" }: IconHamburgerProps) {
  return (
    <span className={`icon-hamburger ${open ? "is-open" : ""} ${className}`.trim()} aria-hidden>
      <span className="icon-hamburger__bar" />
      <span className="icon-hamburger__bar" />
      <span className="icon-hamburger__bar" />
    </span>
  );
}
