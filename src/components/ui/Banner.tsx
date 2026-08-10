import "./Banner.scss";

interface BannerProps {
  tone?: "error" | "success";
  children: string;
}

export function Banner({ tone = "error", children }: BannerProps) {
  return <div className={`banner banner--${tone}`}>{children}</div>;
}
