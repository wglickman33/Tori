import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { PasswordField } from "../components/ui/PasswordField";
import { TextField } from "../components/ui/TextField";
import { useAuthStore } from "../store/authStore";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { useSettingsStore, type Theme } from "../store/settingsStore";
import "./SettingsPage.scss";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const clearHousehold = useHouseholdStore((s) => s.clear);
  const clearInventory = useInventoryStore((s) => s.clear);
  const household = useHouseholdStore((s) => s.household);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const savePreferences = useSettingsStore((s) => s.savePreferences);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const passwordChangeIncomplete = Boolean(newPassword) && !currentPassword;

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (passwordChangeIncomplete) {
      setError("Current password is required to set a new password.");
      return;
    }
    setSaving(true);
    try {
      const body: {
        displayName?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        displayName: displayName.trim(),
        email: email.trim(),
      };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      await updateProfile(body);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const onSaveAppearance = async () => {
    setError(null);
    setMessage(null);
    setSavingTheme(true);
    try {
      await savePreferences();
      setMessage("Appearance saved to your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save appearance");
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <AppShell>
      <div className="settings-page">
        <header className="settings-page__header">
          <h1>Settings</h1>
          <p>Profile, appearance, household, and account.</p>
        </header>

        {error ? <Banner>{error}</Banner> : null}
        {message ? <Banner tone="success">{message}</Banner> : null}

        <section className="settings-page__card">
          <h2>Profile</h2>
          <form className="settings-page__form" onSubmit={onSaveProfile}>
            <TextField
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <p className="settings-page__hint">
              Leave password fields blank to keep your current password.
            </p>
            <Button type="submit" disabled={saving || !displayName.trim() || !email.trim()}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </section>

        <section className="settings-page__card">
          <h2>Appearance</h2>
          <p className="settings-page__hint">
            Changes apply immediately on this device. Save to sync across devices.
          </p>
          <div className="settings-page__field">
            <span className="settings-page__label">Theme</span>
            <div className="settings-page__segmented" role="group" aria-label="Theme">
              {THEME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`settings-page__segment${theme === value ? " settings-page__segment--active" : ""}`}
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="settings-page__hint">Auto follows your device&apos;s light or dark setting.</p>
          </div>
          <Button type="button" onClick={onSaveAppearance} disabled={savingTheme}>
            {savingTheme ? "Saving…" : "Save appearance"}
          </Button>
        </section>

        <section className="settings-page__card">
          <h2>Household</h2>
          <p className="settings-page__hint">
            {household
              ? `${household.name} · ${household.role === "owner" ? "Owner" : "Member"} · ${household.memberCount} member${
                  household.memberCount === 1 ? "" : "s"
                }`
              : "No household yet."}
          </p>
          <Link to={household ? "/household" : "/onboarding"} className="settings-page__link">
            {household ? "Manage household" : "Create or join a household"}
          </Link>
        </section>

        <section className="settings-page__card settings-page__card--danger">
          <h2>Delete account</h2>
          <p className="settings-page__hint">
            Permanently deletes your login. If you own a household with other members, remove them
            first.
          </p>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </section>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        title="Delete account"
        confirmLabel="Delete"
        message="This cannot be undone. Your credentials and membership will be removed."
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteAccount();
          clearInventory();
          clearHousehold();
          navigate("/login");
        }}
      />
    </AppShell>
  );
}
