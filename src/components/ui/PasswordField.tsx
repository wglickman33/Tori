import { useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { EyeIcon } from "./EyeIcon";
import "./PasswordField.scss";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export function PasswordField({
  label,
  error,
  id,
  className = "",
  ...props
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`password-field ${className}`.trim()}>
      <label className="password-field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className={`password-field__control${error ? " is-invalid" : ""}`}>
        <input
          id={fieldId}
          className="password-field__input"
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          aria-pressed={visible}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {error ? <span className="password-field__error">{error}</span> : null}
    </div>
  );
}
