import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TextField } from "../components/ui/TextField";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useInventoryStore } from "../store/inventoryStore";
import { buildTagRows } from "../utils/inventoryFilters";
import "./TagsPage.scss";

const PAGE_SIZE = 10;

export default function TagsPage() {
  useEnsureInventory();
  const items = useInventoryStore((s) => s.items);
  const updateItem = useInventoryStore((s) => s.updateItem);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const rows = useMemo(() => buildTagRows(items), [items]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [nextName, setNextName] = useState("");
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const visibleRows = rows.slice(0, visible);

  const renameTag = async () => {
    if (!editingTag) return;
    const trimmed = nextName.trim();
    if (!trimmed) {
      setError("Tag name is required");
      return;
    }
    if (trimmed === editingTag) {
      setEditingTag(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const targets = items.filter((item) => item.tags.includes(editingTag));
      await Promise.all(
        targets.map((item) =>
          updateItem(item.id, {
            tags: [...new Set(item.tags.map((t) => (t === editingTag ? trimmed : t)))],
          })
        )
      );
      setEditingTag(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename tag");
    } finally {
      setBusy(false);
    }
  };

  const removeTag = async () => {
    if (!deletingTag) return;
    const targets = items.filter((item) => item.tags.includes(deletingTag));
    await Promise.all(
      targets.map((item) =>
        updateItem(item.id, {
          tags: item.tags.filter((t) => t !== deletingTag),
        })
      )
    );
  };

  return (
    <AppShell>
      <div className="tags-page">
        <header className="tags-page__header">
          <div>
            <h1>Tags</h1>
            <p>Rename or remove tags across every item that uses them.</p>
          </div>
        </header>

        {isLoading ? <p>Loading tags…</p> : null}

        {!isLoading && rows.length === 0 ? (
          <div className="tags-page__empty">
            <p>No tags yet. Add tags when creating or editing items.</p>
            <Link className="tags-page__link" to="/inventory">
              Go to Inventory
            </Link>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <>
            <div className="tags-page__table-wrap">
              <table className="tags-page__table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.tag}>
                      <td>{row.tag}</td>
                      <td>{row.itemCount}</td>
                      <td className="tags-page__actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTag(row.tag);
                            setNextName(row.tag);
                            setError(null);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => setDeletingTag(row.tag)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visible < rows.length ? (
              <Button type="button" variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Show more
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      <Modal
        title="Rename tag"
        isOpen={!!editingTag}
        onClose={() => {
          setEditingTag(null);
          setError(null);
        }}
      >
        <div className="tags-page__modal">
          {error ? <Banner>{error}</Banner> : null}
          <TextField
            label="Tag name"
            value={nextName}
            onChange={(e) => setNextName(e.target.value)}
          />
          <div className="tags-page__modal-actions">
            <Button type="button" variant="ghost" onClick={() => setEditingTag(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={renameTag} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deletingTag}
        title="Delete tag"
        message={`Remove “${deletingTag}” from every item that has it? Items themselves stay in your inventory.`}
        onClose={() => setDeletingTag(null)}
        onConfirm={removeTag}
      />
    </AppShell>
  );
}
