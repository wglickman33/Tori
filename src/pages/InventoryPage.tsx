import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { FolderFormModal } from "../components/inventory/FolderFormModal";
import { ItemFormModal } from "../components/inventory/ItemFormModal";
import { ItemImageControls } from "../components/inventory/ItemImageControls";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import type { Folder, Item } from "../api/client";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { downloadHouseholdCsv } from "../utils/exportCsv";
import "./InventoryPage.scss";

export default function InventoryPage() {
  useEnsureInventory();
  const { id: selectedId } = useParams();
  const navigate = useNavigate();
  const household = useHouseholdStore((s) => s.household);
  const {
    folders,
    items,
    openFolderIds,
    isLoading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    createItem,
    updateItem,
    deleteItem,
    uploadItemImage,
    deleteItemImage,
    toggleFolder,
  } = useInventoryStore();

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const independentItems = useMemo(
    () => items.filter((item) => !item.folderId),
    [items]
  );

  const itemsByFolder = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      if (!item.folderId) continue;
      const list = map.get(item.folderId) ?? [];
      list.push(item);
      map.set(item.folderId, list);
    }
    return map;
  }, [items]);

  const isEmpty = folders.length === 0 && items.length === 0;
  const showDetailSheet = Boolean(selectedId);

  const selectItem = (itemId: string) => navigate(`/inventory/${itemId}`);
  const clearSelection = () => navigate("/inventory");

  const onExport = async () => {
    if (!household?.id) return;
    setExportError(null);
    setExporting(true);
    try {
      await downloadHouseholdCsv(household.id);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className={`inventory-page ${showDetailSheet ? "inventory-page--detail" : ""}`}>
        <section className="inventory-page__list">
          <div className="inventory-page__toolbar">
            <div>
              <h1 className="inventory-page__title">Inventory</h1>
              <p className="inventory-page__subtitle">{household?.name}</p>
            </div>
            <div className="inventory-page__actions">
              <Button type="button" variant="ghost" onClick={() => navigate("/household")}>
                Household
              </Button>
              <Button type="button" variant="ghost" onClick={onExport} disabled={exporting}>
                {exporting ? "Exporting…" : "Export CSV"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingFolder(null);
                  setFolderModalOpen(true);
                }}
              >
                Add folder
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setItemModalOpen(true);
                }}
              >
                Add item
              </Button>
            </div>
          </div>
          {exportError ? <Banner>{exportError}</Banner> : null}

          {error ? <p className="inventory-page__error">{error}</p> : null}
          {isLoading ? <p className="inventory-page__status">Loading inventory…</p> : null}

          {!isLoading && isEmpty ? (
            <div className="inventory-page__empty">
              <h2>Your inventory is empty</h2>
              <p>Create a folder to group items, or add an independent item to get started.</p>
              <Button
                type="button"
                onClick={() => {
                  setEditingFolder(null);
                  setFolderModalOpen(true);
                }}
              >
                Create your first folder
              </Button>
            </div>
          ) : null}

          {!isLoading && !isEmpty ? (
            <div className="inventory-page__sections">
              {folders.map((folder) => {
                const folderItems = itemsByFolder.get(folder.id) ?? [];
                const open = !!openFolderIds[folder.id];
                return (
                  <div key={folder.id} className="inventory-folder">
                    <div className="inventory-folder__row">
                      <button
                        type="button"
                        className="inventory-folder__toggle"
                        onClick={() => toggleFolder(folder.id)}
                      >
                        <span aria-hidden="true">{open ? "v" : ">"}</span>
                        <span className="inventory-folder__name">{folder.name}</span>
                        <span className="inventory-folder__meta">
                          {folder.category} · {folderItems.length}
                        </span>
                      </button>
                      <div className="inventory-folder__controls">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolder(folder);
                            setFolderModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => setDeletingFolder(folder)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {open ? (
                      <ul className="inventory-item-list">
                        {folderItems.length === 0 ? (
                          <li className="inventory-item-list__empty">No items in this folder</li>
                        ) : (
                          folderItems.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                className={`inventory-item ${selectedId === item.id ? "is-active" : ""}`}
                                onClick={() => selectItem(item.id)}
                              >
                                <span>{item.name}</span>
                                <span>{item.quantity}</span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    ) : null}
                  </div>
                );
              })}

              <div className="inventory-folder">
                <div className="inventory-folder__row">
                  <div className="inventory-folder__toggle inventory-folder__toggle--static">
                    <span className="inventory-folder__name">Independent items</span>
                    <span className="inventory-folder__meta">{independentItems.length}</span>
                  </div>
                </div>
                <ul className="inventory-item-list">
                  {independentItems.length === 0 ? (
                    <li className="inventory-item-list__empty">No independent items</li>
                  ) : (
                    independentItems.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`inventory-item ${selectedId === item.id ? "is-active" : ""}`}
                          onClick={() => selectItem(item.id)}
                        >
                          <span>{item.name}</span>
                          <span>{item.quantity}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ) : null}
        </section>

        <section className="inventory-page__detail">
          {selectedItem ? (
            <div className="item-detail">
              <div className="item-detail__top">
                <Link to="/inventory" className="item-detail__back" onClick={clearSelection}>
                  Back
                </Link>
                <div className="item-detail__controls">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingItem(selectedItem);
                      setItemModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button type="button" onClick={() => setDeletingItem(selectedItem)}>
                    Delete
                  </Button>
                </div>
              </div>
              <h2 className="item-detail__name">{selectedItem.name}</h2>
              <ItemImageControls
                imageUrl={selectedItem.imageUrl}
                onUpload={(file) => uploadItemImage(selectedItem.id, file).then(() => undefined)}
                onRemove={() => deleteItemImage(selectedItem.id).then(() => undefined)}
              />
              <dl className="item-detail__grid">
                <div>
                  <dt>Location</dt>
                  <dd>{selectedItem.location || "—"}</dd>
                </div>
                <div>
                  <dt>Folder</dt>
                  <dd>
                    {selectedItem.folderId
                      ? folders.find((f) => f.id === selectedItem.folderId)?.name ?? "—"
                      : "Independent"}
                  </dd>
                </div>
                <div>
                  <dt>Quantity</dt>
                  <dd>{selectedItem.quantity}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{selectedItem.price ? `$${selectedItem.price}` : "—"}</dd>
                </div>
                <div>
                  <dt>Purchase date</dt>
                  <dd>{selectedItem.purchaseDate || "—"}</dd>
                </div>
                <div>
                  <dt>Expiration date</dt>
                  <dd>{selectedItem.expirationDate || "—"}</dd>
                </div>
              </dl>
              <div className="item-detail__tags">
                <h3>Tags</h3>
                {selectedItem.tags.length === 0 ? (
                  <p>No tags</p>
                ) : (
                  <ul>
                    {selectedItem.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="inventory-page__detail-empty">
              <h2>Select an item</h2>
              <p>Choose something from the list to see details, edit, or delete it.</p>
            </div>
          )}
        </section>
      </div>

      <FolderFormModal
        isOpen={folderModalOpen}
        folder={editingFolder}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={async (body) => {
          if (editingFolder) await updateFolder(editingFolder.id, body);
          else await createFolder(body);
        }}
      />

      <ItemFormModal
        isOpen={itemModalOpen}
        item={editingItem}
        folders={folders}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        onUploadImage={
          editingItem
            ? (file) => uploadItemImage(editingItem.id, file).then(() => undefined)
            : undefined
        }
        onRemoveImage={
          editingItem
            ? () => deleteItemImage(editingItem.id).then(() => undefined)
            : undefined
        }
        onSubmit={async (body, pendingImage) => {
          if (editingItem) {
            await updateItem(editingItem.id, body);
            return;
          }
          const created = await createItem(body);
          if (pendingImage) await uploadItemImage(created.id, pendingImage);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingFolder}
        title="Delete folder"
        message="This permanently deletes the folder and every item inside it."
        onClose={() => setDeletingFolder(null)}
        onConfirm={async () => {
          if (!deletingFolder) return;
          await deleteFolder(deletingFolder.id);
          if (selectedItem?.folderId === deletingFolder.id) clearSelection();
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        title="Delete item"
        message="This permanently deletes the item from your household inventory."
        onClose={() => setDeletingItem(null)}
        onConfirm={async () => {
          if (!deletingItem) return;
          await deleteItem(deletingItem.id);
          if (selectedId === deletingItem.id) clearSelection();
        }}
      />
    </AppShell>
  );
}
