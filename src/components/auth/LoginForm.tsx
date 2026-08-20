import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { authApi } from "../../api/client";
import { translateError } from "../../i18n/apiErrors";
import { useAuthStore } from "../../store/authStore";
import { useHouseholdStore } from "../../store/householdStore";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { PasswordField } from "../ui/PasswordField";
import { TextField } from "../ui/TextField";
import "./LoginForm.scss";

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);
  const fetchMine = useHouseholdStore((s) => s.fetchMine);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resetNotice =
    (location.state as { passwordReset?: boolean } | null)?.passwordReset === true;

  const schema = z.object({
    email: z.string().email(t("auth.validEmail")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const parsed = schema.safeParse({ email, password });
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
      const session = await authApi.login(parsed.data.email, parsed.data.password);
      signIn(session.user, session.accessToken, session.refreshToken);
      const household = await fetchMine();
      navigate(household ? "/inventory" : "/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.loginFailed");
      setApiError(translateError(message, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      <header className="login-form__header">
        <h1 className="login-form__title">{t("auth.logIn")}</h1>
        <p className="login-form__subtitle">{t("auth.welcomeBack")}</p>
      </header>
      {resetNotice ? <Banner tone="success">{t("auth.passwordUpdated")}</Banner> : null}
      {apiError ? <Banner>{apiError}</Banner> : null}
      <TextField
        label={t("auth.email")}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <PasswordField
        label={t("auth.password")}
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <p className="login-form__forgot">
        <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
      </p>
      <Button type="submit" disabled={loading}>
        {loading ? t("auth.loggingIn") : t("auth.logIn")}
      </Button>
      <p className="login-form__footer">
        {t("auth.needAccount")} <Link to="/signup">{t("auth.signUp")}</Link>
      </p>
    </form>
  );
}
