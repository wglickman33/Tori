import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHouseholdStore } from "../../store/householdStore";
import { useInventoryStore } from "../../store/inventoryStore";
import "./HouseholdSwitcher.scss";

interface HouseholdSwitcherProps {
  collapsed?: boolean;
}

export function HouseholdSwitcher({ collapsed = false }: HouseholdSwitcherProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const households = useHouseholdStore((s) => s.households);
  const household = useHouseholdStore((s) => s.household);
  const selectHousehold = useHouseholdStore((s) => s.selectHousehold);
  const clearInventory = useInventoryStore((s) => s.clear);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!household) return null;

  const onSelect = (id: string) => {
    if (id === household.id) {
      setOpen(false);
      return;
    }
    clearInventory();
    selectHousehold(id);
    setOpen(false);
    navigate("/inventory");
  };

  return (
    <div
      className={`household-switcher${collapsed ? " household-switcher--collapsed" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={collapsed ? "household-switcher__avatar" : "household-switcher__pill"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        title={collapsed ? household.name : undefined}
        aria-label={collapsed ? `${t("household.switcher")}: ${household.name}` : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {collapsed ? (
          <span aria-hidden>{household.name.slice(0, 1).toUpperCase()}</span>
        ) : (
          <>
            <span className="household-switcher__name">{household.name}</span>
            <span
              className={`household-switcher__chevron${open ? " is-open" : ""}`}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="household-switcher__chevron-icon">
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </>
        )}
      </button>
      {open ? (
        <div
          className={`household-switcher__menu${collapsed ? " household-switcher__menu--collapsed" : ""}`}
          id={listId}
          role="listbox"
        >
          {households.map((h) => (
            <button
              key={h.id}
              type="button"
              role="option"
              aria-selected={h.id === household.id}
              className={`household-switcher__option${h.id === household.id ? " is-active" : ""}`}
              onClick={() => onSelect(h.id)}
            >
              <span>{h.name}</span>
              {!collapsed ? (
                <span className="household-switcher__role">
                  {h.role === "owner" ? t("household.roleOwner") : t("household.roleMember")}
                </span>
              ) : null}
            </button>
          ))}
          <Link
            to="/onboarding"
            className="household-switcher__option household-switcher__option--add"
            onClick={() => setOpen(false)}
          >
            {t("household.addHousehold")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
