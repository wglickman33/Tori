import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { InviteCodePanel } from "../components/ui/InviteCodePanel";
import { TextField } from "../components/ui/TextField";
import { useAuthStore } from "../store/authStore";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import "./HouseholdPage.scss";

export default function HouseholdPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const household = useHouseholdStore((s) => s.household);
  const members = useHouseholdStore((s) => s.members);
  const regenerateCode = useHouseholdStore((s) => s.regenerateCode);
  const rename = useHouseholdStore((s) => s.rename);
  const loadMembers = useHouseholdStore((s) => s.loadMembers);
  const removeMember = useHouseholdStore((s) => s.removeMember);
  const leave = useHouseholdStore((s) => s.leave);
  const clearHousehold = useHouseholdStore((s) => s.clear);
  const clearInventory = useInventoryStore((s) => s.clear);

  const [name, setName] = useState(household?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    void loadMembers().catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load members")
    );
  }, [loadMembers, household?.id]);

  useEffect(() => {
    setName(household?.name ?? "");
  }, [household?.name]);

  const onRename = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await rename(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename household");
    } finally {
      setSaving(false);
    }
  };

  const afterLeave = () => {
    clearInventory();
    clearHousehold();
    navigate("/onboarding");
  };

  return (
    <AppShell>
      <div className="household-page">
        <header className="household-page__header">
          <h1>Household</h1>
          <p>Invite people, manage roles, and keep one shared inventory.</p>
        </header>

        {error ? <Banner>{error}</Banner> : null}

        {household?.role === "owner" ? (
          <section className="household-page__card">
            <h2>Name</h2>
            <form className="household-page__rename" onSubmit={onRename}>
              <TextField label="Household name" value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? "Saving…" : "Save name"}
              </Button>
            </form>
          </section>
        ) : (
          <section className="household-page__card">
            <h2>{household?.name}</h2>
            <p className="household-page__muted">You are a member of this household.</p>
          </section>
        )}

        {household?.role === "owner" && household.inviteCode ? (
          <section className="household-page__card">
            <h2>Invite code</h2>
            <InviteCodePanel inviteCode={household.inviteCode} onRegenerate={regenerateCode} />
          </section>
        ) : null}

        <section className="household-page__card">
          <h2>Members ({members.length || household?.memberCount || 0})</h2>
          <ul className="household-page__members">
            {members.map((member) => (
              <li key={member.userId}>
                <div>
                  <strong>{member.displayName}</strong>
                  <span>{member.email}</span>
                  <em>{member.role}</em>
                </div>
                {household?.role === "owner" && member.userId !== userId ? (
                  <Button type="button" variant="ghost" onClick={() => setRemovingId(member.userId)}>
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="household-page__card household-page__card--danger">
          <h2>{household?.role === "owner" ? "Dissolve household" : "Leave household"}</h2>
          <p className="household-page__muted">
            {household?.role === "owner"
              ? "If you are the only member, leaving deletes this household and its inventory. With other members, remove them first."
              : "You will lose access to this shared inventory until invited again."}
          </p>
          <Button type="button" variant="secondary" onClick={() => setLeaveOpen(true)}>
            {household?.role === "owner" ? "Leave / dissolve" : "Leave household"}
          </Button>
        </section>
      </div>

      <ConfirmDeleteModal
        isOpen={!!removingId}
        title="Remove member"
        message="They will lose access to this household inventory immediately."
        onClose={() => setRemovingId(null)}
        onConfirm={async () => {
          if (!removingId) return;
          await removeMember(removingId);
        }}
      />

      <ConfirmDeleteModal
        isOpen={leaveOpen}
        title="Leave household"
        confirmLabel="Leave"
        message={
          household?.role === "owner"
            ? "If you are the only member, this permanently deletes the household and all inventory."
            : "You will leave this household and return to onboarding."
        }
        onClose={() => setLeaveOpen(false)}
        onConfirm={async () => {
          await leave();
          afterLeave();
        }}
      />
    </AppShell>
  );
}
