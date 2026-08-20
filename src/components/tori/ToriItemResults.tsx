import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ToriMatchedItem } from "../../api/client";
import { ToriItemCard } from "./ToriItemCard";
import "./ToriItemResults.scss";

type ToriItemResultsProps = {
  items: ToriMatchedItem[];
  variant?: "page" | "widget";
};

export function ToriItemResults({ items, variant = "page" }: ToriItemResultsProps) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const compact = variant === "widget";
  const overflow = items.length > 6;

  const scrollBy = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".tori-item-card");
    const delta = (card?.offsetWidth ?? 240) + 12;
    track.scrollBy({ left: direction * delta, behavior: "smooth" });
  };

  if (items.length === 1) {
    return (
      <div className={`tori-item-results tori-item-results--single tori-item-results--${variant}`}>
        <ToriItemCard item={items[0]!} compact={compact} />
      </div>
    );
  }

  return (
    <div className={`tori-item-results tori-item-results--carousel tori-item-results--${variant}`}>
      <div className="tori-item-results__header">
        <p className="tori-item-results__hint">{t("ai.swipeToCompare")}</p>
        <div className="tori-item-results__nav">
          <button
            type="button"
            className="tori-item-results__nav-btn"
            onClick={() => scrollBy(-1)}
            aria-label={t("ai.scrollPrev")}
          >
            ‹
          </button>
          <button
            type="button"
            className="tori-item-results__nav-btn"
            onClick={() => scrollBy(1)}
            aria-label={t("ai.scrollNext")}
          >
            ›
          </button>
        </div>
      </div>
      <div className="tori-item-results__track" ref={trackRef}>
        {items.map((item) => (
          <ToriItemCard key={item.id} item={item} compact={compact} />
        ))}
      </div>
      {overflow ? (
        <p className="tori-item-results__more">{t("ai.moreInInventory", { count: items.length })}</p>
      ) : null}
    </div>
  );
}
