import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { authApi } from "../../api/client";
import { translateError } from "../../i18n/apiErrors";
import { useAuthStore } from "../../store/authStore";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { PasswordField } from "../ui/PasswordField";
import { TextField } from "../ui/TextField";
import "./SignupForm.scss";

export function SignupForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const schema = z
    .object({
      displayName: z.string().trim().min(1, t("errors.displayNameRequired")),
      email: z.string().email(t("auth.validEmail")),
      password: z.string().min(8, t("auth.passwordMin")),
      confirmPassword: z.string().min(1, t("auth.confirmYourPassword")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordsMatch"),
      path: ["confirmPassword"],
    });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const parsed = schema.safeParse({ displayName, email, password, confirmPassword });
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
      const session = await authApi.register(
        parsed.data.displayName,
        parsed.data.email,
        parsed.data.password
      );
      signIn(session.user, session.accessToken, session.refreshToken);
      navigate("/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.signupFailed");
      setApiError(translateError(message, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="signup-form" onSubmit={onSubmit} noValidate>
      <header className="signup-form__header">
        <h1 className="signup-form__title">{t("auth.createAccountTitle")}</h1>
        <p className="signup-form__subtitle">{t("auth.signupSubtitle")}</p>
      </header>
      {apiError ? <Banner>{apiError}</Banner> : null}
      <TextField
        label={t("auth.displayName")}
        name="displayName"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={errors.displayName}
      />
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
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <PasswordField
        label={t("auth.confirmPassword")}
        name="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />
      <Button type="submit" disabled={loading}>
        {loading ? t("auth.creating") : t("auth.createAccount")}
      </Button>
      <p className="signup-form__footer">
        {t("auth.haveAccount")} <Link to="/login">{t("auth.logIn")}</Link>
      </p>
    </form>
  );
}
