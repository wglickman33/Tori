import { useTranslation } from "react-i18next";
import type { ToriMatchedItem } from "../../api/client";
import { currentDateLocale } from "../../i18n";

type ToriItemCardProps = {
  item: ToriMatchedItem;
  compact?: boolean;
};

function formatPrice(price: string | null, locale: string): string | null {
  if (price === null || price.trim() === "") return null;
  const value = Number(price);
  if (!Number.isFinite(value)) return price;
  return value.toLocaleString(locale, { style: "currency", currency: "USD" });
}

export function ToriItemCard({ item, compact = false }: ToriItemCardProps) {
  const { t } = useTranslation();
  const price = formatPrice(item.price, currentDateLocale());

  return (
    <article className={`tori-item-card${compact ? " tori-item-card--compact" : ""}`}>
      <span className="tori-item-card__thumb" aria-hidden>
        <span className="tori-item-card__thumb-fallback" />
      </span>
      <div className="tori-item-card__copy">
        <h4 className="tori-item-card__name">{item.name}</h4>
        <dl className="tori-item-card__meta">
          <div>
            <dt>{t("ai.itemLocation")}</dt>
            <dd>{item.location?.trim() || t("inventory.none")}</dd>
          </div>
          <div>
            <dt>{t("common.quantity")}</dt>
            <dd>{item.quantity}</dd>
          </div>
          <div>
            <dt>{t("ai.itemPriceEach")}</dt>
            <dd>{price ?? t("inventory.none")}</dd>
          </div>
        </dl>
        {item.folderName ? (
          <p className="tori-item-card__folder">{item.folderName}</p>
        ) : null}
      </div>
    </article>
  );
}
