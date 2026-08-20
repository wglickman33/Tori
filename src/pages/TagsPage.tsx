import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TextField } from "../components/ui/TextField";
import { translateError } from "../i18n/apiErrors";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useInventoryStore } from "../store/inventoryStore";
import { toastSuccess } from "../store/toastStore";
import { buildTagRows, type TagRow } from "../utils/inventoryFilters";
import { suggestTagMerges } from "../utils/tagMergeSuggest";
import "./TagsPage.scss";

type TagSort = "popular" | "alpha";

function popularityTier(count: number, max: number): 1 | 2 | 3 {
  if (max <= 1) return 1;
  const ratio = count / max;
  if (ratio >= 0.66) return 3;
  if (ratio >= 0.33) return 2;
  return 1;
}

function searchHrefForTag(tag: string): string {
  const params = new URLSearchParams();
  params.set("tag", encodeURIComponent(tag));
  return `/search?${params.toString()}`;
}

export default function TagsPage() {
  useEnsureInventory();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useInventoryStore((s) => s.items);
  const updateItem = useInventoryStore((s) => s.updateItem);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const rows = useMemo(() => buildTagRows(items), [items]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<TagSort>("popular");
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [nextName, setNextName] = useState("");
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [keepByPair, setKeepByPair] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pairKey = (a: string, b: string) =>
    [a, b].sort((x, y) => x.localeCompare(y)).join("\0");

  const countByTag = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.tag, row.itemCount);
    return map;
  }, [rows]);

  const maxCount = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.itemCount), 0),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let list = rows;
    if (q) list = list.filter((r) => r.tag.toLowerCase().includes(q));
    if (sort === "popular") {
      return [...list].sort(
        (a, b) => b.itemCount - a.itemCount || a.tag.localeCompare(b.tag)
      );
    }
    return [...list].sort((a, b) => a.tag.localeCompare(b.tag));
  }, [rows, filter, sort]);

  const suggestions = useMemo(() => {
    const raw = suggestTagMerges(rows.map((r) => r.tag));
    return raw.filter((s) => {
      const key = [s.a, s.b].sort((x, y) => x.localeCompare(y)).join("\0");
      return !dismissed.has(key);
    });
  }, [rows, dismissed]);

  const applyTagReplace = async (fromTags: string[], toTag: string) => {
    const fromSet = new Set(fromTags);
    const targets = items.filter((item) => item.tags.some((t) => fromSet.has(t)));
    await Promise.all(
      targets.map((item) => {
        const next = [
          ...new Set(item.tags.map((t) => (fromSet.has(t) ? toTag : t))),
        ];
        return updateItem(item.id, { tags: next });
      })
    );
  };

  const renameTag = async () => {
    if (!editingTag) return;
    const trimmed = nextName.trim();
    if (!trimmed) {
      setError(t("errors.tagNameRequired"));
      return;
    }
    if (trimmed.length > 40) {
      setError(t("errors.tagMax"));
      return;
    }
    if (trimmed === editingTag) {
      setEditingTag(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const merging = rows.some((r) => r.tag === trimmed && r.tag !== editingTag);
      await applyTagReplace([editingTag], trimmed);
      toastSuccess(
        merging
          ? t("tags.merged", { from: editingTag, to: trimmed })
          : t("tags.renamed", { from: editingTag, to: trimmed })
      );
      setEditingTag(null);
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.couldNotRenameTag");
      setError(translateError(raw, t));
    } finally {
      setBusy(false);
    }
  };

  const removeTag = async () => {
    if (!deletingTag) return;
    const removed = deletingTag;
    const targets = items.filter((item) => item.tags.includes(deletingTag));
    await Promise.all(
      targets.map((item) =>
        updateItem(item.id, {
          tags: item.tags.filter((t) => t !== deletingTag),
        })
      )
    );
    toastSuccess(t("tags.deleted", { name: removed }));
  };

  const dismissSuggestion = (a: string, b: string) => {
    setDismissed((prev) => new Set(prev).add(pairKey(a, b)));
  };

  const mergeSuggestion = async (a: string, b: string, keep: string) => {
    const drop = keep === a ? b : a;
    setBusy(true);
    setError(null);
    try {
      await applyTagReplace([a, b], keep);
      toastSuccess(t("tags.merged", { from: drop, to: keep }));
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.couldNotMergeTags");
      setError(translateError(raw, t));
    } finally {
      setBusy(false);
    }
  };

  const openTagSearch = (tag: string) => {
    navigate(searchHrefForTag(tag));
  };

  return (
    <AppShell>
      <div className="tags-page">
        <header className="tags-page__header">
          <div className="tags-page__heading">
            <h1>{t("tags.title")}</h1>
            <p>{t("tags.subtitle")}</p>
          </div>
        </header>

        {isLoading ? <p className="tags-page__muted">{t("tags.loading")}</p> : null}

        {!isLoading && rows.length === 0 ? (
          <div className="tags-page__empty">
            <p>{t("tags.empty")}</p>
            <Link className="tags-page__link" to="/inventory">
              {t("tags.goInventory")}
            </Link>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <>
            <div className="tags-page__toolbar">
              <label className="tags-page__filter">
                <span className="tags-page__sr">{t("tags.filter")}</span>
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={t("tags.placeholder")}
                />
              </label>
              <div className="tags-page__sort" role="group" aria-label={t("tags.sort")}>
                <button
                  type="button"
                  className={sort === "popular" ? "is-on" : undefined}
                  onClick={() => setSort("popular")}
                >
                  {t("tags.popular")}
                </button>
                <button
                  type="button"
                  className={sort === "alpha" ? "is-on" : undefined}
                  onClick={() => setSort("alpha")}
                >
                  {t("tags.alpha")}
                </button>
              </div>
            </div>

            {suggestions.length > 0 ? (
              <section className="tags-page__suggest" aria-labelledby="tags-suggest-title">
                <div className="tags-page__suggest-head">
                  <h2 id="tags-suggest-title">{t("tags.suggested")}</h2>
                  <p>{t("tags.suggestedCopy")}</p>
                </div>
                <ul className="tags-page__suggest-list">
                  {suggestions.map((s) => {
                    const key = pairKey(s.a, s.b);
                    const keepDefault =
                      (countByTag.get(s.a) ?? 0) >= (countByTag.get(s.b) ?? 0) ? s.a : s.b;
                    const activeKeep = keepByPair[key] ?? keepDefault;
                    return (
                      <li key={key} className="tags-page__suggest-card">
                        <div className="tags-page__suggest-pair">
                          <span>
                            <strong>{s.a}</strong>
                            <em>{countByTag.get(s.a) ?? 0}</em>
                          </span>
                          <span className="tags-page__suggest-amp" aria-hidden>
                            ~
                          </span>
                          <span>
                            <strong>{s.b}</strong>
                            <em>{countByTag.get(s.b) ?? 0}</em>
                          </span>
                        </div>
                        <div className="tags-page__suggest-keep" role="group" aria-label={t("tags.keepTag")}>
                          <span className="tags-page__suggest-label">{t("tags.keep")}</span>
                          <button
                            type="button"
                            className={activeKeep === s.a ? "is-on" : undefined}
                            onClick={() =>
                              setKeepByPair((prev) => ({ ...prev, [key]: s.a }))
                            }
                          >
                            {s.a}
                          </button>
                          <button
                            type="button"
                            className={activeKeep === s.b ? "is-on" : undefined}
                            onClick={() =>
                              setKeepByPair((prev) => ({ ...prev, [key]: s.b }))
                            }
                          >
                            {s.b}
                          </button>
                        </div>
                        <div className="tags-page__suggest-actions">
                          <Button
                            type="button"
                            onClick={() => void mergeSuggestion(s.a, s.b, activeKeep)}
                            disabled={busy}
                          >
                            {t("common.merge")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => dismissSuggestion(s.a, s.b)}
                          >
                            {t("common.dismiss")}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {visibleRows.length === 0 ? (
              <p className="tags-page__muted">{t("tags.noMatch")}</p>
            ) : (
              <ul className="tags-page__cloud">
                {visibleRows.map((row) => (
                  <TagChip
                    key={row.tag}
                    row={row}
                    tier={popularityTier(row.itemCount, maxCount)}
                    onOpen={() => openTagSearch(row.tag)}
                    onEdit={() => {
                      setEditingTag(row.tag);
                      setNextName(row.tag);
                      setError(null);
                    }}
                    onDelete={() => setDeletingTag(row.tag)}
                  />
                ))}
              </ul>
            )}
          </>
        ) : null}

        {error && !editingTag ? (
          <p className="tags-page__inline-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <Modal
        title={t("tags.renameTitle")}
        isOpen={!!editingTag}
        onClose={() => {
          setEditingTag(null);
          setError(null);
        }}
      >
        <div className="tags-page__modal">
          {error ? <Banner>{error}</Banner> : null}
          <TextField
            label={t("tags.tagName")}
            value={nextName}
            onChange={(e) => setNextName(e.target.value)}
            maxLength={40}
            autoFocus
          />
          {nextName.trim() &&
          editingTag &&
          nextName.trim() !== editingTag &&
          rows.some((r) => r.tag === nextName.trim()) ? (
            <p className="tags-page__merge-hint">
              {t("tags.mergeHint", { name: nextName.trim() })}
            </p>
          ) : null}
          <div className="tags-page__modal-actions">
            <Button type="button" variant="ghost" onClick={() => setEditingTag(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={renameTag} disabled={busy}>
              {busy ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deletingTag}
        title={t("tags.deleteTitle")}
        message={t("tags.deleteMessage", { name: deletingTag })}
        confirmLabel={t("common.delete")}
        onClose={() => setDeletingTag(null)}
        onConfirm={removeTag}
      />
    </AppShell>
  );
}

function TagChip({
  row,
  tier,
  onOpen,
  onEdit,
  onDelete,
}: {
  row: TagRow;
  tier: 1 | 2 | 3;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className={`tags-page__chip tags-page__chip--tier-${tier}`}>
      <button type="button" className="tags-page__chip-main" onClick={onOpen}>
        <span className="tags-page__chip-hash" aria-hidden>
          #
        </span>
        <span className="tags-page__chip-name">{row.tag}</span>
        <span className="tags-page__chip-count">{row.itemCount}</span>
      </button>
      <div className="tags-page__chip-actions">
        <button type="button" onClick={onEdit} aria-label={t("tags.editAria", { name: row.tag })}>
          {t("common.edit")}
        </button>
        <button type="button" onClick={onDelete} aria-label={t("tags.deleteAria", { name: row.tag })}>
          {t("common.delete")}
        </button>
      </div>
    </li>
  );
}
