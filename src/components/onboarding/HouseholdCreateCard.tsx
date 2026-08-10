import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useHouseholdStore } from "../../store/householdStore";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import "./HouseholdCreateCard.scss";

const schema = z.object({
  name: z.string().trim().min(1, "Household name is required").max(80),
});

export function HouseholdCreateCard() {
  const navigate = useNavigate();
  const create = useHouseholdStore((s) => s.create);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ name });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setLoading(true);
    try {
      await create(parsed.data.name);
      navigate("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create household");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="household-create-card" onSubmit={onSubmit} noValidate>
      <h2 className="household-create-card__title">Create a household</h2>
      <p className="household-create-card__copy">
        You’ll be the owner and can invite others with a code.
      </p>
      {error ? <Banner>{error}</Banner> : null}
      <TextField
        label="Household name"
        name="householdName"
        placeholder="The Glickmans"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldError}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create household"}
      </Button>
    </form>
  );
}
