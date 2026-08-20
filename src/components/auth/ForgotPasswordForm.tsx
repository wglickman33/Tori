import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { authApi } from "../../api/client";
import { translateError } from "../../i18n/apiErrors";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import "./ForgotPasswordForm.scss";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    email: z.string().email(t("auth.validEmail")),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setMessage(null);
    const parsed = schema.safeParse({ email });
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
      const res = await authApi.forgotPassword(parsed.data.email);
      setMessage(translateError(res.message, t));
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("auth.couldNotSendReset");
      setApiError(translateError(raw, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="forgot-password-form" onSubmit={onSubmit} noValidate>
      <h1 className="forgot-password-form__title">{t("auth.forgotTitle")}</h1>
      <p className="forgot-password-form__subtitle">{t("auth.forgotCopy")}</p>
      {apiError ? <Banner>{apiError}</Banner> : null}
      {message ? <Banner tone="success">{message}</Banner> : null}
      <TextField
        label={t("auth.email")}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Button type="submit" disabled={loading}>
        {loading ? t("auth.sending") : t("auth.sendReset")}
      </Button>
      <p className="forgot-password-form__footer">
        <Link to="/login">{t("auth.backToLogin")}</Link>
      </p>
    </form>
  );
}
