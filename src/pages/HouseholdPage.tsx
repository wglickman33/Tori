import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { InviteCodePanel } from "../components/ui/InviteCodePanel";
import { TextField } from "../components/ui/TextField";
import { translateError } from "../i18n/apiErrors";
import { useAuthStore } from "../store/authStore";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import "./HouseholdPage.scss";

export default function HouseholdPage() {
  const { t } = useTranslation();
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

  const roleLabel = (role: string | undefined): string => {
    if (role === "owner") return t("common.owner");
    if (role === "member") return t("common.member");
    return role ? role : t("common.member");
  };

  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    void loadMembers()
      .catch((err) => {
        if (!cancelled) {
          const raw = err instanceof Error ? err.message : t("errors.couldNotLoadMembers");
          setError(translateError(raw, t));
        }
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadMembers, household?.id, t]);

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
      const raw = err instanceof Error ? err.message : t("errors.couldNotRenameHousehold");
      setError(translateError(raw, t));
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
            <h1>{t("household.title")}</h1>
            <p>{t("household.subtitle")}</p>
          </div>
          <div className="household-page__identity" aria-label={t("household.summary")}>
            <span className="household-page__identity-name">
              {household?.name ?? t("household.yourHousehold")}
            </span>
            <span
              className={`household-page__pill household-page__pill--${
                household?.role === "owner" ? "owner" : "member"
              }`}
            >
              {yourRole}
            </span>
            <span className="household-page__identity-count">
              {t("common.memberCount", { count: memberCount })}
            </span>
          </div>
        </header>

        {error ? <Banner>{error}</Banner> : null}

        {household?.role === "owner" ? (
          <section className="household-page__card">
            <h2>{t("inventory.name")}</h2>
            <form className="household-page__rename" onSubmit={onRename}>
              <TextField
                className="household-page__rename-field"
                label={t("onboarding.householdName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? t("common.saving") : t("household.saveName")}
              </Button>
            </form>
          </section>
        ) : (
          <section className="household-page__card">
            <h2>{t("inventory.name")}</h2>
            <p className="household-page__readonly-name">{household?.name}</p>
            <p className="household-page__muted">{t("household.memberOf")}</p>
          </section>
        )}

        {household?.role === "owner" && household.inviteCode ? (
          <section className="household-page__card">
            <h2>{t("household.invite")}</h2>
            <InviteCodePanel
              embedded
              inviteCode={household.inviteCode}
              onRegenerate={async () => {
                setError(null);
                try {
                  await regenerateCode();
                } catch (err) {
                  const raw =
                    err instanceof Error ? err.message : t("errors.couldNotRegenerate");
                  setError(translateError(raw, t));
                  throw err;
                }
              }}
            />
          </section>
        ) : null}

        <section className="household-page__card">
          <h2>{t("household.membersTitle", { count: memberCount })}</h2>
          {membersLoading ? (
            <p className="household-page__muted">{t("household.loadingMembers")}</p>
          ) : members.length === 0 ? (
            <p className="household-page__muted">{t("household.noMembers")}</p>
          ) : (
            <ul className="household-page__members">
              {members.map((member) => {
                const isYou = member.userId === userId;
                return (
                  <li key={member.userId} className="household-page__member">
                    <div className="household-page__member-main">
                      <div className="household-page__member-top">
                        <strong className="household-page__member-name">{member.displayName}</strong>
                        {isYou ? (
                          <span className="household-page__pill household-page__pill--you">
                            {t("household.you")}
                          </span>
                        ) : null}
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
                        {t("household.removeMember")}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="household-page__card household-page__card--danger">
          <h2>
            {household?.role === "owner" ? t("household.dissolve") : t("household.leave")}
          </h2>
          <p className="household-page__muted">
            {household?.role === "owner" ? t("household.dissolveCopy") : t("household.leaveCopy")}
          </p>
          <Button type="button" variant="secondary" onClick={() => setLeaveOpen(true)}>
            {household?.role === "owner" ? t("household.leaveDissolve") : t("household.leave")}
          </Button>
        </section>
      </div>

      <ConfirmDeleteModal
        isOpen={!!removingId}
        title={t("household.removeTitle")}
        message={t("household.removeMessage")}
        onClose={() => setRemovingId(null)}
        onConfirm={async () => {
          if (!removingId) return;
          await removeMember(removingId);
        }}
      />

      <ConfirmDeleteModal
        isOpen={leaveOpen}
        title={t("household.leaveTitle")}
        confirmLabel={t("household.leaveAction")}
        message={
          household?.role === "owner"
            ? t("household.leaveConfirmOwner")
            : t("household.leaveConfirmMember")
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
