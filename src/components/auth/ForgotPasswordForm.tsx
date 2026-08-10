import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { authApi } from "../../api/client";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import "./ForgotPasswordForm.scss";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setMessage(res.message);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="forgot-password-form" onSubmit={onSubmit} noValidate>
      <h1 className="forgot-password-form__title">Forgot password</h1>
      <p className="forgot-password-form__subtitle">
        Enter your email and we will send a reset link if an account exists.
      </p>
      {apiError ? <Banner>{apiError}</Banner> : null}
      {message ? <Banner tone="success">{message}</Banner> : null}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      <p className="forgot-password-form__footer">
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}
