import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { authApi } from "../../api/client";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import "./ResetPasswordForm.scss";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!token) {
      setApiError("This reset link is missing a token. Request a new one from the login page.");
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
      setApiError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="reset-password-form" onSubmit={onSubmit} noValidate>
      <h1 className="reset-password-form__title">Set a new password</h1>
      <p className="reset-password-form__subtitle">Choose a new password for your Tori account.</p>
      {apiError ? <Banner>{apiError}</Banner> : null}
      <TextField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={errors.newPassword}
      />
      <TextField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </Button>
      <p className="reset-password-form__footer">
        <Link to="/forgot-password">Request a new link</Link>
        {" · "}
        <Link to="/login">Back to log in</Link>
      </p>
    </form>
  );
}
