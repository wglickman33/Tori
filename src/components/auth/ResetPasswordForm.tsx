import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { authApi } from "../../api/client";
import { translateError } from "../../i18n/apiErrors";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import "./ResetPasswordForm.scss";

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const schema = z
    .object({
      newPassword: z.string().min(8, t("auth.passwordMin")),
      confirmPassword: z.string().min(1, t("auth.confirmYourPassword")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("auth.passwordsMatch"),
      path: ["confirmPassword"],
    });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!token) {
      setApiError(t("auth.missingResetToken"));
      return;
    }
    const parsed = schema.safeParse({ newPassword, confirmPassword });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await authApi.resetPassword(token, parsed.data.newPassword);
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("auth.couldNotReset");
      setApiError(translateError(raw, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="reset-password-form" onSubmit={onSubmit} noValidate>
      <h1 className="reset-password-form__title">{t("auth.setNewPassword")}</h1>
      <p className="reset-password-form__subtitle">{t("auth.resetCopy")}</p>
      {apiError ? <Banner>{apiError}</Banner> : null}
      <TextField
        label={t("auth.newPassword")}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={errors.newPassword}
      />
      <TextField
        label={t("auth.confirmPassword")}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />
      <Button type="submit" disabled={loading}>
        {loading ? t("auth.updating") : t("auth.resetButton")}
      </Button>
      <p className="reset-password-form__footer">
        <Link to="/forgot-password">{t("auth.requestNewLink")}</Link>
        {" · "}
        <Link to="/login">{t("auth.backToLogin")}</Link>
      </p>
    </form>
  );
}
