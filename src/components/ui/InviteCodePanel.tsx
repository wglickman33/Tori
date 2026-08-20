import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import "./InviteCodePanel.scss";

interface InviteCodePanelProps {
  inviteCode: string;
  onRegenerate: () => Promise<void>;
  /** When true, omit outer card chrome (parent section already provides it). */
  embedded?: boolean;
}

export function InviteCodePanel({
  inviteCode,
  onRegenerate,
  embedded = false,
}: InviteCodePanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      await onRegenerate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`invite-code-panel${embedded ? " invite-code-panel--embedded" : ""}`.trim()}>
      {!embedded ? <h2 className="invite-code-panel__title">{t("household.inviteTitle")}</h2> : null}
      <p className="invite-code-panel__copy">{t("household.inviteCopy")}</p>
      <div className="invite-code-panel__code" aria-label={t("household.invite")}>
        {inviteCode}
      </div>
      <div className="invite-code-panel__actions">
        <Button type="button" variant="secondary" onClick={copy}>
          {copied ? t("household.copied") : t("household.copyCode")}
        </Button>
        <Button type="button" variant="ghost" onClick={regenerate} disabled={busy}>
          {busy ? t("household.regenerating") : t("household.regenerateAction")}
        </Button>
      </div>
    </div>
  );
}
