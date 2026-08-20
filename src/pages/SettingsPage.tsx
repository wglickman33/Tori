import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { PasswordField } from "../components/ui/PasswordField";
import { TextField } from "../components/ui/TextField";
import { translateError } from "../i18n/apiErrors";
import { useAuthStore } from "../store/authStore";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { useSettingsStore, type Language, type Theme } from "../store/settingsStore";
import "./SettingsPage.scss";

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const clearHousehold = useHouseholdStore((s) => s.clear);
  const clearInventory = useInventoryStore((s) => s.clear);
  const household = useHouseholdStore((s) => s.household);
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const savePreferences = useSettingsStore((s) => s.savePreferences);

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "light", label: t("theme.light") },
    { value: "dark", label: t("theme.dark") },
    { value: "auto", label: t("theme.auto") },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: "en", label: t("language.english") },
    { value: "es", label: t("language.spanish") },
  ];

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
      setError(t("errors.currentPasswordRequired"));
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
      setMessage(t("settings.profileSaved"));
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.saveProfile");
      setError(translateError(raw, t));
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
      setMessage(t("settings.appearanceSaved"));
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.saveAppearance");
      setError(translateError(raw, t));
    } finally {
      setSavingTheme(false);
    }
  };

  const roleLabel = household?.role === "owner" ? t("common.owner") : t("common.member");
  const memberCountLabel = t("settings.member", { count: household?.memberCount ?? 0 });

  return (
    <AppShell>
      <div className="settings-page">
        <header className="settings-page__header">
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </header>

        {error ? <Banner>{error}</Banner> : null}
        {message ? <Banner tone="success">{message}</Banner> : null}

        <section className="settings-page__card">
          <h2>{t("settings.profile")}</h2>
          <form className="settings-page__form" onSubmit={onSaveProfile}>
            <TextField
              label={t("settings.displayName")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <TextField
              label={t("settings.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordField
              label={t("settings.currentPassword")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <PasswordField
              label={t("settings.newPassword")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <p className="settings-page__hint">{t("settings.passwordHint")}</p>
            <Button type="submit" disabled={saving || !displayName.trim() || !email.trim()}>
              {saving ? t("common.saving") : t("settings.saveProfile")}
            </Button>
          </form>
        </section>

        <section className="settings-page__card">
          <h2>{t("settings.appearance")}</h2>
          <p className="settings-page__hint">{t("settings.appearanceHint")}</p>
          <div className="settings-page__field">
            <span className="settings-page__label">{t("settings.theme")}</span>
            <div className="settings-page__segmented" role="group" aria-label={t("settings.theme")}>
              {themeOptions.map(({ value, label }) => (
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
            <p className="settings-page__hint">{t("settings.autoHint")}</p>
          </div>
          <div className="settings-page__field">
            <span className="settings-page__label">{t("language.label")}</span>
            <div className="settings-page__segmented" role="group" aria-label={t("language.label")}>
              {languageOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`settings-page__segment${language === value ? " settings-page__segment--active" : ""}`}
                  aria-pressed={language === value}
                  onClick={() => setLanguage(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="settings-page__hint">{t("settings.languageHint")}</p>
          </div>
          <Button type="button" onClick={onSaveAppearance} disabled={savingTheme}>
            {savingTheme ? t("common.saving") : t("settings.saveAppearance")}
          </Button>
        </section>

        <section className="settings-page__card">
          <h2>{t("settings.household")}</h2>
          <p className="settings-page__hint">
            {household
              ? t("settings.householdMeta", {
                  name: household.name,
                  role: roleLabel,
                  count: memberCountLabel,
                })
              : t("settings.noHousehold")}
          </p>
          <Link to={household ? "/household" : "/onboarding"} className="settings-page__link">
            {household ? t("settings.manageHousehold") : t("settings.createOrJoin")}
          </Link>
        </section>

        <section className="settings-page__card settings-page__card--danger">
          <h2>{t("settings.deleteAccount")}</h2>
          <p className="settings-page__hint">{t("settings.deleteHint")}</p>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
            {t("settings.deleteAccount")}
          </Button>
        </section>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        title={t("settings.deleteAccount")}
        confirmLabel={t("common.delete")}
        message={t("settings.deleteConfirm")}
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
