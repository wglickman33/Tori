/** Trigger a browser download from a Blob or string payload. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mime = "text/plain;charset=utf-8"
): void {
  downloadBlob(filename, new Blob([contents], { type: mime }));
}

export function downloadJsonFile(filename: string, data: unknown): void {
  downloadTextFile(filename, `${JSON.stringify(data, null, 2)}\n`, "application/json;charset=utf-8");
}

export function slugifyFilename(value: string, fallback = "tori-inventory"): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || fallback
  );
}
