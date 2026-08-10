import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useHouseholdStore } from "../../store/householdStore";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import "./HouseholdJoinCard.scss";

const schema = z.object({
  inviteCode: z.string().trim().min(4, "Enter a valid invite code"),
});

export function HouseholdJoinCard() {
  const navigate = useNavigate();
  const join = useHouseholdStore((s) => s.join);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ inviteCode });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setLoading(true);
    try {
      await join(parsed.data.inviteCode);
      navigate("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join household");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="household-join-card" onSubmit={onSubmit} noValidate>
      <div className="household-join-card__intro">
        <p className="household-join-card__eyebrow">Have a code?</p>
        <h2 className="household-join-card__title">Join a household</h2>
        <p className="household-join-card__copy">
          Enter the invite code from someone who already set up Tori.
        </p>
      </div>
      <div className="household-join-card__fields">
        {error ? <Banner>{error}</Banner> : null}
        <TextField
          label="Invite code"
          name="inviteCode"
          placeholder="ABCD1234"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          error={fieldError}
          autoCapitalize="characters"
          spellCheck={false}
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="household-join-card__submit"
        disabled={loading}
      >
        {loading ? "Joining…" : "Join household"}
      </Button>
    </form>
  );
}
