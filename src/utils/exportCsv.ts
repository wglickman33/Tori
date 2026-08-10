import { getAccessToken, inventoryApi } from "../api/client";

export async function downloadHouseholdCsv(householdId: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(inventoryApi.exportCsvUrl(householdId), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Export failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tori-inventory.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
