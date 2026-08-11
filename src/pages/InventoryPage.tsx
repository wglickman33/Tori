import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resolveMediaUrl, type Folder, type Item } from "../api/client";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { FolderFormModal } from "../components/inventory/FolderFormModal";
import { ItemFormModal } from "../components/inventory/ItemFormModal";
import { ItemImageControls } from "../components/inventory/ItemImageControls";
import { MoveItemModal } from "../components/inventory/MoveItemModal";
import { InventoryTransferBar } from "../components/inventory/InventoryTransferBar";
import { Button } from "../components/ui/Button";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { daysUntilExpiration } from "../utils/inventoryFilters";
import { expirationLabel } from "../utils/expiring";
import { toastSuccess } from "../store/toastStore";
import "./InventoryPage.scss";

function FolderChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`inventory-folder__chevron${open ? " is-open" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function itemExpiryTone(expirationDate: string | null): "ok" | "soon" | "overdue" | null {
  const days = daysUntilExpiration(expirationDate);
  if (days === null) return null;
  if (days < 0) return "overdue";
  if (days <= 7) return "soon";
  return "ok";
}

function InventoryItemRow({
  item,
  selected,
  onSelect,
  onMove,
}: {
  item: Item;
  selected: boolean;
  onSelect: () => void;
  onMove: () => void;
}) {
  const thumb = resolveMediaUrl(item.imageUrl);
  const tone = itemExpiryTone(item.expirationDate);
  const expiry = expirationLabel(item.expirationDate);
  const metaBits = [
    item.location || null,
    `Qty ${item.quantity}`,
  ].filter(Boolean);

  return (
    <div className={`inventory-item${selected ? " is-active" : ""}`}>
      <button type="button" className="inventory-item__main" onClick={onSelect}>
        <span className="inventory-item__thumb" aria-hidden>
          {thumb ? <img src={thumb} alt="" /> : <span className="inventory-item__thumb-fallback" />}
        </span>
        <span className="inventory-item__copy">
          <span className="inventory-item__name">{item.name}</span>
          <span className="inventory-item__meta">{metaBits.join(" · ")}</span>
          {tone ? (
            <span className={`inventory-item__expiry inventory-item__expiry--${tone}`}>
              {tone === "overdue" ? "Overdue" : `Expires: ${expiry}`}
            </span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        className="inventory-item__move"
        onClick={onMove}
        aria-label={`Move ${item.name}`}
      >
        Move
      </button>
    </div>
  );
}

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
  const [defaultFolderId, setDefaultFolderId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [movingItem, setMovingItem] = useState<Item | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

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

  const openAddItem = (folderId: string | null = null) => {
    setEditingItem(null);
    setDefaultFolderId(folderId);
    setItemModalOpen(true);
  };

  return (
    <AppShell>
      <div className={`inventory-page ${showDetailSheet ? "inventory-page--detail" : ""}`}>
        <section className="inventory-page__list">
          <div className="inventory-page__toolbar">
            <header className="inventory-page__heading">
              <h1 className="inventory-page__title">Inventory</h1>
              {household ? (
                <Link to="/household" className="inventory-page__household-link">
                  {household.name}
                </Link>
              ) : (
                <p className="inventory-page__subtitle">No household selected</p>
              )}
            </header>
            <div className="inventory-page__actions" role="group" aria-label="Inventory actions">
              <Button
                type="button"
                className="inventory-page__action inventory-page__action--primary"
                onClick={() => openAddItem(null)}
              >
                Add item
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="inventory-page__action"
                onClick={() => {
                  setEditingFolder(null);
                  setFolderModalOpen(true);
                }}
              >
                Add folder
              </Button>
            </div>
            <InventoryTransferBar
              className="inventory-page__transfer"
              householdName={household?.name}
              folders={folders}
              items={items}
            />
          </div>
          {error ? <p className="inventory-page__error">{error}</p> : null}
          {isLoading ? <p className="inventory-page__status">Loading inventory…</p> : null}

          {!isLoading && isEmpty ? (
            <div className="inventory-page__empty">
              <h2>Your inventory is empty</h2>
              <p>Create a folder to group items, or add an independent item to get started.</p>
              <div className="inventory-page__empty-actions">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderModalOpen(true);
                  }}
                >
                  Create your first folder
                </Button>
                <Button type="button" variant="secondary" onClick={() => openAddItem(null)}>
                  Add an item
                </Button>
              </div>
            </div>
          ) : null}

          {!isLoading && !isEmpty ? (
            <div className="inventory-page__sections">
              {folders.map((folder) => {
                const folderItems = itemsByFolder.get(folder.id) ?? [];
                const open = openFolderIds[folder.id] !== false;
                return (
                  <div key={folder.id} className={`inventory-folder${open ? " is-open" : ""}`}>
                    <div className="inventory-folder__row">
                      <button
                        type="button"
                        className="inventory-folder__toggle"
                        onClick={() => toggleFolder(folder.id)}
                        aria-expanded={open}
                      >
                        <FolderChevron open={open} />
                        <span className="inventory-folder__text">
                          <span className="inventory-folder__name">{folder.name}</span>
                          <span className="inventory-folder__meta">
                            {folder.category} · {folderItems.length}{" "}
                            {folderItems.length === 1 ? "item" : "items"}
                          </span>
                        </span>
                      </button>
                      <div className="inventory-folder__controls">
                        <button
                          type="button"
                          className="inventory-folder__control"
                          onClick={() => openAddItem(folder.id)}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className="inventory-folder__control"
                          onClick={() => {
                            setEditingFolder(folder);
                            setFolderModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="inventory-folder__control inventory-folder__control--danger"
                          onClick={() => setDeletingFolder(folder)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {open ? (
                      <ul className="inventory-item-list">
                        {folderItems.length === 0 ? (
                          <li className="inventory-item-list__empty">
                            No items yet.{" "}
                            <button type="button" onClick={() => openAddItem(folder.id)}>
                              Add one
                            </button>
                          </li>
                        ) : (
                          folderItems.map((item) => (
                            <li key={item.id}>
                              <InventoryItemRow
                                item={item}
                                selected={selectedId === item.id}
                                onSelect={() => selectItem(item.id)}
                                onMove={() => setMovingItem(item)}
                              />
                            </li>
                          ))
                        )}
                      </ul>
                    ) : null}
                  </div>
                );
              })}

              <div className="inventory-folder inventory-folder--independent is-open">
                <div className="inventory-folder__row">
                  <div className="inventory-folder__toggle inventory-folder__toggle--static">
                    <span className="inventory-folder__text">
                      <span className="inventory-folder__name">Independent items</span>
                      <span className="inventory-folder__meta">
                        {independentItems.length}{" "}
                        {independentItems.length === 1 ? "item" : "items"} outside folders
                      </span>
                    </span>
                  </div>
                  <div className="inventory-folder__controls">
                    <button
                      type="button"
                      className="inventory-folder__control"
                      onClick={() => openAddItem(null)}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <ul className="inventory-item-list">
                  {independentItems.length === 0 ? (
                    <li className="inventory-item-list__empty">No independent items</li>
                  ) : (
                    independentItems.map((item) => (
                      <li key={item.id}>
                        <InventoryItemRow
                          item={item}
                          selected={selectedId === item.id}
                          onSelect={() => selectItem(item.id)}
                          onMove={() => setMovingItem(item)}
                        />
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
                  <Button type="button" variant="ghost" onClick={() => setMovingItem(selectedItem)}>
                    Move
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDefaultFolderId(null);
                      setEditingItem(selectedItem);
                      setItemModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setDeletingItem(selectedItem)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <h2 className="item-detail__name">{selectedItem.name}</h2>
              <ItemImageControls
                imageUrl={selectedItem.imageUrl}
                onUpload={(file) => uploadItemImage(selectedItem.id, file).then(() => undefined)}
                onRemove={() => deleteItemImage(selectedItem.id).then(() => undefined)}
                immediate
              />
              <dl className="item-detail__grid">
                <div>
                  <dt>Location</dt>
                  <dd>{selectedItem.location || "-"}</dd>
                </div>
                <div>
                  <dt>Folder</dt>
                  <dd>
                    {selectedItem.folderId
                      ? folders.find((f) => f.id === selectedItem.folderId)?.name ?? "-"
                      : "Independent"}
                  </dd>
                </div>
                <div>
                  <dt>Quantity</dt>
                  <dd>{selectedItem.quantity}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{selectedItem.price ? `$${selectedItem.price}` : "-"}</dd>
                </div>
                <div>
                  <dt>Purchase date</dt>
                  <dd>{selectedItem.purchaseDate || "-"}</dd>
                </div>
                <div>
                  <dt>Expiration date</dt>
                  <dd>
                    {selectedItem.expirationDate
                      ? `${selectedItem.expirationDate} (${expirationLabel(selectedItem.expirationDate)})`
                      : "-"}
                  </dd>
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
              <p>Choose something from the list to see details, edit, move, or delete it.</p>
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
          if (editingFolder) {
            await updateFolder(editingFolder.id, body);
            toastSuccess(`Folder “${body.name}” updated`);
          } else {
            await createFolder(body);
            toastSuccess(`Folder “${body.name}” created`);
          }
        }}
      />

      <ItemFormModal
        isOpen={itemModalOpen}
        item={editingItem}
        folders={folders}
        defaultFolderId={editingItem ? null : defaultFolderId}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
          setDefaultFolderId(null);
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
            toastSuccess(`Item “${body.name}” updated`);
            return;
          }
          const created = await createItem(body);
          if (pendingImage) await uploadItemImage(created.id, pendingImage);
          toastSuccess(`Item “${body.name}” created`);
        }}
      />

      <MoveItemModal
        isOpen={!!movingItem}
        item={movingItem}
        folders={folders}
        onClose={() => setMovingItem(null)}
        onCreateFolder={createFolder}
        onMove={async (folderId) => {
          if (!movingItem) return;
          const name = movingItem.name;
          await updateItem(movingItem.id, { folderId });
          const dest =
            folderId === null
              ? "Unfiled"
              : (useInventoryStore.getState().folders.find((f) => f.id === folderId)?.name ??
                "another folder");
          toastSuccess(`Moved “${name}” to ${dest}`);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingFolder}
        title="Delete folder"
        message="This permanently deletes the folder and every item inside it."
        onClose={() => setDeletingFolder(null)}
        onConfirm={async () => {
          if (!deletingFolder) return;
          const name = deletingFolder.name;
          await deleteFolder(deletingFolder.id);
          if (selectedItem?.folderId === deletingFolder.id) clearSelection();
          toastSuccess(`Folder “${name}” deleted`);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        title="Delete item"
        message="This permanently deletes the item from your household inventory."
        onClose={() => setDeletingItem(null)}
        onConfirm={async () => {
          if (!deletingItem) return;
          const name = deletingItem.name;
          await deleteItem(deletingItem.id);
          if (selectedId === deletingItem.id) clearSelection();
          toastSuccess(`Item “${name}” deleted`);
        }}
      />
    </AppShell>
  );
}
