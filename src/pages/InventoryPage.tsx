import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl, type Folder, type Item } from "../api/client";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { FolderFormModal } from "../components/inventory/FolderFormModal";
import { ItemFormModal } from "../components/inventory/ItemFormModal";
import { ItemImageControls } from "../components/inventory/ItemImageControls";
import { MoveItemModal } from "../components/inventory/MoveItemModal";
import { InventoryTransferBar } from "../components/inventory/InventoryTransferBar";
import { Button } from "../components/ui/Button";
import { translateError } from "../i18n/apiErrors";
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
  const { t } = useTranslation();
  const thumb = resolveMediaUrl(item.imageUrl);
  const tone = itemExpiryTone(item.expirationDate);
  const expiry = expirationLabel(item.expirationDate);
  const metaBits = [item.location || null, t("common.qty", { count: item.quantity })].filter(Boolean);

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
              {tone === "overdue" ? t("inventory.overdue") : t("inventory.expires", { label: expiry })}
            </span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        className="inventory-item__move"
        onClick={onMove}
        aria-label={t("inventory.moveItem", { name: item.name })}
      >
        {t("common.move")}
      </button>
    </div>
  );
}

export default function InventoryPage() {
  useEnsureInventory();
  const { t } = useTranslation();
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
    <AppShell lockContentScroll>
      <div className={`inventory-page ${showDetailSheet ? "inventory-page--detail" : ""}`}>
        <section className="inventory-page__list">
          <div className="inventory-page__toolbar">
            <header className="inventory-page__heading">
              <h1 className="inventory-page__title">{t("inventory.title")}</h1>
              {household ? (
                <Link to="/household" className="inventory-page__household-link">
                  {household.name}
                </Link>
              ) : (
                <p className="inventory-page__subtitle">{t("inventory.noHousehold")}</p>
              )}
            </header>
            <div className="inventory-page__actions" role="group" aria-label={t("inventory.actions")}>
              <Button
                type="button"
                className="inventory-page__action inventory-page__action--primary"
                onClick={() => openAddItem(null)}
              >
                {t("inventory.addItem")}
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
                {t("inventory.addFolder")}
              </Button>
            </div>
            <InventoryTransferBar
              className="inventory-page__transfer"
              householdName={household?.name}
              folders={folders}
              items={items}
            />
          </div>
          {error ? <p className="inventory-page__error">{translateError(error, t)}</p> : null}
          {isLoading ? <p className="inventory-page__status">{t("inventory.loading")}</p> : null}

          {!isLoading && isEmpty ? (
            <div className="inventory-page__empty">
              <h2>{t("inventory.emptyTitle")}</h2>
              <p>{t("inventory.emptyBody")}</p>
              <div className="inventory-page__empty-actions">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderModalOpen(true);
                  }}
                >
                  {t("inventory.createFirstFolder")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => openAddItem(null)}>
                  {t("inventory.addAnItem")}
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
                            {t(`categories.${folder.category}`, { defaultValue: folder.category })} ·{" "}
                            {t("common.item", { count: folderItems.length })}
                          </span>
                        </span>
                      </button>
                      <div className="inventory-folder__controls">
                        <button
                          type="button"
                          className="inventory-folder__control"
                          onClick={() => openAddItem(folder.id)}
                        >
                          {t("common.add")}
                        </button>
                        <button
                          type="button"
                          className="inventory-folder__control"
                          onClick={() => {
                            setEditingFolder(folder);
                            setFolderModalOpen(true);
                          }}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          type="button"
                          className="inventory-folder__control inventory-folder__control--danger"
                          onClick={() => setDeletingFolder(folder)}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </div>
                    {open ? (
                      <ul className="inventory-item-list">
                        {folderItems.length === 0 ? (
                          <li className="inventory-item-list__empty">
                            {t("inventory.noItems")}{" "}
                            <button type="button" onClick={() => openAddItem(folder.id)}>
                              {t("inventory.addOne")}
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
                      <span className="inventory-folder__name">{t("inventory.independent")}</span>
                      <span className="inventory-folder__meta">
                        {t("inventory.outsideFolders", { count: independentItems.length })}
                      </span>
                    </span>
                  </div>
                  <div className="inventory-folder__controls">
                    <button
                      type="button"
                      className="inventory-folder__control"
                      onClick={() => openAddItem(null)}
                    >
                      {t("common.add")}
                    </button>
                  </div>
                </div>
                <ul className="inventory-item-list">
                  {independentItems.length === 0 ? (
                    <li className="inventory-item-list__empty">{t("inventory.noIndependent")}</li>
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
                  {t("common.back")}
                </Link>
                <div className="item-detail__controls">
                  <Button type="button" variant="ghost" onClick={() => setMovingItem(selectedItem)}>
                    {t("common.move")}
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
                    {t("common.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setDeletingItem(selectedItem)}
                  >
                    {t("common.delete")}
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
                  <dt>{t("inventory.location")}</dt>
                  <dd>{selectedItem.location || t("common.dash")}</dd>
                </div>
                <div>
                  <dt>{t("inventory.folder")}</dt>
                  <dd>
                    {selectedItem.folderId
                      ? folders.find((f) => f.id === selectedItem.folderId)?.name ?? t("common.dash")
                      : t("inventory.independentLabel")}
                  </dd>
                </div>
                <div>
                  <dt>{t("common.quantity")}</dt>
                  <dd>{selectedItem.quantity}</dd>
                </div>
                <div>
                  <dt>{t("inventory.price")}</dt>
                  <dd>{selectedItem.price ? `$${selectedItem.price}` : t("common.dash")}</dd>
                </div>
                <div>
                  <dt>{t("inventory.purchaseDate")}</dt>
                  <dd>{selectedItem.purchaseDate || t("common.dash")}</dd>
                </div>
                <div>
                  <dt>{t("inventory.expirationDate")}</dt>
                  <dd>
                    {selectedItem.expirationDate
                      ? `${selectedItem.expirationDate} (${expirationLabel(selectedItem.expirationDate)})`
                      : t("common.dash")}
                  </dd>
                </div>
              </dl>
              <div className="item-detail__tags">
                <h3>{t("inventory.tags")}</h3>
                {selectedItem.tags.length === 0 ? (
                  <p>{t("inventory.noTags")}</p>
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
              <h2>{t("inventory.selectItem")}</h2>
              <p>{t("inventory.selectItemBody")}</p>
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
            toastSuccess(t("inventory.folderUpdated", { name: body.name }));
          } else {
            await createFolder(body);
            toastSuccess(t("inventory.folderCreated", { name: body.name }));
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
            toastSuccess(t("inventory.itemUpdated", { name: body.name }));
            return;
          }
          const created = await createItem(body);
          if (pendingImage) await uploadItemImage(created.id, pendingImage);
          toastSuccess(t("inventory.itemCreated", { name: body.name }));
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
              ? t("inventory.unfiled")
              : (useInventoryStore.getState().folders.find((f) => f.id === folderId)?.name ??
                t("inventory.anotherFolder"));
          toastSuccess(t("inventory.movedTo", { name, dest }));
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingFolder}
        title={t("inventory.deleteFolder")}
        message={t("inventory.deleteFolderMessage")}
        onClose={() => setDeletingFolder(null)}
        onConfirm={async () => {
          if (!deletingFolder) return;
          const name = deletingFolder.name;
          await deleteFolder(deletingFolder.id);
          if (selectedItem?.folderId === deletingFolder.id) clearSelection();
          toastSuccess(t("inventory.folderDeleted", { name }));
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        title={t("inventory.deleteItem")}
        message={t("inventory.deleteItemMessage")}
        onClose={() => setDeletingItem(null)}
        onConfirm={async () => {
          if (!deletingItem) return;
          const name = deletingItem.name;
          await deleteItem(deletingItem.id);
          if (selectedId === deletingItem.id) clearSelection();
          toastSuccess(t("inventory.itemDeletedNamed", { name }));
        }}
      />
    </AppShell>
  );
}
