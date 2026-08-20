import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { translateError } from "../../i18n/apiErrors";
import { useAuthStore } from "../../store/authStore";
import { useHouseholdStore } from "../../store/householdStore";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import "./HouseholdCreateCard.scss";

function householdNamePlaceholder(t: (key: string, opts?: Record<string, string>) => string, displayName?: string | null): string {
  const trimmed = displayName?.trim();
  if (!trimmed) return t("onboarding.myHousehold");

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return t("onboarding.namedHousehold", { name: parts[parts.length - 1]! });
  }

  return t("onboarding.possessiveHousehold", { name: parts[0]! });
}

export function HouseholdCreateCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const displayName = useAuthStore((s) => s.user?.displayName);
  const create = useHouseholdStore((s) => s.create);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t("errors.householdNameRequired")).max(80),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ name });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setLoading(true);
    try {
      await create(parsed.data.name);
      navigate("/inventory");
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("onboarding.couldNotCreate");
      setError(translateError(raw, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="household-create-card" onSubmit={onSubmit} noValidate>
      <div className="household-create-card__intro">
        <p className="household-create-card__eyebrow">{t("onboarding.startFresh")}</p>
        <h2 className="household-create-card__title">{t("onboarding.createTitle")}</h2>
        <p className="household-create-card__copy">{t("onboarding.createEyebrowCopy")}</p>
      </div>
      <div className="household-create-card__fields">
        {error ? <Banner>{error}</Banner> : null}
        <TextField
          label={t("onboarding.householdName")}
          name="householdName"
          placeholder={householdNamePlaceholder(t, displayName)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldError}
          autoComplete="organization"
        />
      </div>
      <Button type="submit" className="household-create-card__submit" disabled={loading}>
        {loading ? t("onboarding.creating") : t("onboarding.create")}
      </Button>
    </form>
  );
}
