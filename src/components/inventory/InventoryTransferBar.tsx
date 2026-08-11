import { useEffect, useId, useRef, useState } from "react";
import type { Folder, Item } from "../../api/client";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import {
  downloadInventoryCsvFile,
  downloadInventoryJson,
  downloadInventoryPdf,
  downloadInventoryPlainText,
  importInventoryPayload,
  readInventoryTransferFile,
} from "../../utils/inventoryTransfer";
import { useInventoryStore } from "../../store/inventoryStore";
import "./InventoryTransferBar.scss";

interface InventoryTransferBarProps {
  householdName?: string | null;
  folders: Folder[];
  items: Item[];
  className?: string;
}

export function InventoryTransferBar({
  householdName,
  folders,
  items,
  className = "",
}: InventoryTransferBarProps) {
  const menuId = useId();
  const importInputId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState<"export-pdf" | "import" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createFolder = useInventoryStore((s) => s.createFolder);
  const createItem = useInventoryStore((s) => s.createItem);

  useEffect(() => {
    if (!exportOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setExportOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportOpen]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const runExport = async (kind: "json" | "csv" | "txt" | "pdf") => {
    setError(null);
    setMessage(null);
    try {
      if (kind === "json") {
        downloadInventoryJson(folders, items, householdName);
        setMessage("Tori JSON downloaded.");
      } else if (kind === "csv") {
        downloadInventoryCsvFile(folders, items, householdName);
        setMessage("CSV downloaded.");
      } else if (kind === "txt") {
        downloadInventoryPlainText(folders, items, householdName);
        setMessage("Plain text downloaded.");
      } else {
        setBusy("export-pdf");
        await downloadInventoryPdf(folders, items, householdName);
        setMessage("PDF downloaded.");
      }
      setExportOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setMessage(null);
    setBusy("import");
    try {
      const payload = await readInventoryTransferFile(file);
      const result = await importInventoryPayload(payload, {
        folders,
        createFolder,
        createItem,
      });
      setMessage(
        `Imported ${result.itemsCreated} item${result.itemsCreated === 1 ? "" : "s"}` +
          (result.foldersCreated
            ? ` and created ${result.foldersCreated} folder${result.foldersCreated === 1 ? "" : "s"}.`
            : ".")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={`inventory-transfer ${className}`.trim()}>
      <div className="inventory-transfer__controls">
        <div className="inventory-transfer__export" ref={wrapRef}>
          <Button
            type="button"
            variant="ghost"
            className="inventory-transfer__trigger"
            aria-expanded={exportOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setExportOpen((v) => !v)}
            disabled={busy !== null}
          >
            Export
          </Button>
          {exportOpen ? (
            <div className="inventory-transfer__menu" id={menuId} role="menu">
              <button type="button" role="menuitem" onClick={() => void runExport("json")}>
                Tori file (.tori.json)
              </button>
              <button type="button" role="menuitem" onClick={() => void runExport("csv")}>
                Spreadsheet (.csv)
              </button>
              <button type="button" role="menuitem" onClick={() => void runExport("txt")}>
                Plain text (.txt)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void runExport("pdf")}
                disabled={busy === "export-pdf"}
              >
                {busy === "export-pdf" ? "Creating PDF…" : "PDF (.pdf)"}
              </button>
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          variant="secondary"
          className="inventory-transfer__import"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
        >
          {busy === "import" ? "Importing…" : "Import"}
        </Button>
        <input
          ref={fileRef}
          id={importInputId}
          className="inventory-transfer__file"
          type="file"
          accept=".json,.tori.json,.csv,application/json,text/csv"
          onChange={(e) => void onImportFile(e.target.files?.[0])}
        />
      </div>
      <p className="inventory-transfer__hint">Import a Tori JSON or CSV file.</p>
      {error ? <Banner>{error}</Banner> : null}
      {message && !error ? <p className="inventory-transfer__status">{message}</p> : null}
    </div>
  );
}
