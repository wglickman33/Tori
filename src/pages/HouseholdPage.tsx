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

function roleLabel(role: string | undefined): string {
  if (role === "owner") return "Owner";
  if (role === "member") return "Member";
  return role ? role : "Member";
}

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
  const clearInventory = useInventoryStore((s) => s.clear);

  const [name, setName] = useState(household?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    void loadMembers()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load members");
        }
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
    const remaining = useHouseholdStore.getState().household;
    navigate(remaining ? "/inventory" : "/onboarding");
  };

  const memberCount = members.length || household?.memberCount || 0;
  const yourRole = roleLabel(household?.role);

  return (
    <AppShell>
      <div className="household-page">
        <header className="household-page__header">
          <div className="household-page__heading">
            <h1>Household</h1>
            <p>Invite people, manage roles, and keep one shared inventory.</p>
          </div>
          <div className="household-page__identity" aria-label="Household summary">
            <span className="household-page__identity-name">
              {household?.name ?? "Your household"}
            </span>
            <span
              className={`household-page__pill household-page__pill--${
                household?.role === "owner" ? "owner" : "member"
              }`}
            >
              {yourRole}
            </span>
            <span className="household-page__identity-count">
              {memberCount} member{memberCount === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        {error ? <Banner>{error}</Banner> : null}

        {household?.role === "owner" ? (
          <section className="household-page__card">
            <h2>Name</h2>
            <form className="household-page__rename" onSubmit={onRename}>
              <TextField
                className="household-page__rename-field"
                label="Household name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? "Saving…" : "Save name"}
              </Button>
            </form>
          </section>
        ) : (
          <section className="household-page__card">
            <h2>Name</h2>
            <p className="household-page__readonly-name">{household?.name}</p>
            <p className="household-page__muted">You are a member of this household.</p>
          </section>
        )}

        {household?.role === "owner" && household.inviteCode ? (
          <section className="household-page__card">
            <h2>Invite code</h2>
            <InviteCodePanel
              embedded
              inviteCode={household.inviteCode}
              onRegenerate={async () => {
                setError(null);
                try {
                  await regenerateCode();
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Could not regenerate invite code"
                  );
                  throw err;
                }
              }}
            />
          </section>
        ) : null}

        <section className="household-page__card">
          <h2>Members ({memberCount})</h2>
          {membersLoading ? (
            <p className="household-page__muted">Loading members…</p>
          ) : members.length === 0 ? (
            <p className="household-page__muted">No members loaded yet.</p>
          ) : (
            <ul className="household-page__members">
              {members.map((member) => {
                const isYou = member.userId === userId;
                return (
                  <li key={member.userId} className="household-page__member">
                    <div className="household-page__member-main">
                      <div className="household-page__member-top">
                        <strong className="household-page__member-name">{member.displayName}</strong>
                        {isYou ? <span className="household-page__pill household-page__pill--you">You</span> : null}
                        <span
                          className={`household-page__pill household-page__pill--${
                            member.role === "owner" ? "owner" : "member"
                          }`}
                        >
                          {roleLabel(member.role)}
                        </span>
                      </div>
                      <span className="household-page__member-email">{member.email}</span>
                    </div>
                    {household?.role === "owner" && !isYou ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="household-page__remove"
                        onClick={() => setRemovingId(member.userId)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
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
            : "You will leave this household and lose access until invited again."
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
