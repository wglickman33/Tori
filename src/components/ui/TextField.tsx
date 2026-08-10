import type { InputHTMLAttributes } from "react";
import "./TextField.scss";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className = "", ...props }: TextFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className={`text-field ${className}`.trim()} htmlFor={fieldId}>
      <span className="text-field__label">{label}</span>
      <input id={fieldId} className="text-field__input" {...props} />
      {error ? <span className="text-field__error">{error}</span> : null}
    </label>
  );
}
