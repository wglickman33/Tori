import { useState } from "react";
import { Button } from "./Button";
import "./InviteCodePanel.scss";

interface InviteCodePanelProps {
  inviteCode: string;
  onRegenerate: () => Promise<void>;
}

export function InviteCodePanel({ inviteCode, onRegenerate }: InviteCodePanelProps) {
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
    <section className="invite-code-panel">
      <h2 className="invite-code-panel__title">Household invite code</h2>
      <p className="invite-code-panel__copy">Share this code so someone can join your household.</p>
      <div className="invite-code-panel__code">{inviteCode}</div>
      <div className="invite-code-panel__actions">
        <Button type="button" variant="secondary" onClick={copy}>
          {copied ? "Copied" : "Copy code"}
        </Button>
        <Button type="button" variant="ghost" onClick={regenerate} disabled={busy}>
          Regenerate
        </Button>
      </div>
    </section>
  );
}
