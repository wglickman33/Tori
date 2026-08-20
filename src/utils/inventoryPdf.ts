import type { Folder, Item } from "../api/client";
import i18n, { currentDateLocale } from "../i18n";
import { daysUntilExpiration } from "./inventoryFilters";
import { computeInventoryValue, formatMoney, itemQuantity, lineValue } from "./inventoryValue";
import { readExpiringThreshold } from "./expiring";

/** Tori brand-ish PDF colors (0-1 RGB). */
const BRAND = { r: 0, g: 0, b: 0.671 }; // #0000AB
const ACCENT = { r: 0.663, g: 0.663, b: 1 }; // #A9A9FF
const PALE = { r: 0.859, g: 0.859, b: 1 }; // #DBDBFF
const TEXT = { r: 0.08, g: 0.08, b: 0.14 };
const MUTED = { r: 0.35, g: 0.35, b: 0.45 };
const LINE = { r: 0.78, g: 0.78, b: 0.88 };
const ROW_ALT = { r: 0.97, g: 0.97, b: 0.99 };
const WHITE = { r: 1, g: 1, b: 1 };
const DANGER = { r: 0.82, g: 0.18, b: 0.18 };

type PdfFont = { widthOfTextAtSize: (t: string, s: number) => number };

function wrapText(text: string, font: PdfFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function truncate(text: string, font: PdfFont, fontSize: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
  const ellipsis = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = `${text.slice(0, mid)}${ellipsis}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo <= 0 ? ellipsis : `${text.slice(0, lo)}${ellipsis}`;
}

type Col = { label: string; width: number; align?: "left" | "right" };

export async function createInventoryPdf(opts: {
  householdName: string;
  folders: Folder[];
  items: Item[];
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const { householdName, folders, items } = opts;

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Landscape letter - better for wide inventory tables
  const pageWidth = 792;
  const pageHeight = 612;
  const marginX = 36;
  const marginTop = 40;
  const marginBottom = 36;
  const contentWidth = pageWidth - marginX * 2;
  const footerY = 18;

  const exportedAt = new Date();
  const exportLabel = exportedAt.toLocaleString(currentDateLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const valueSummary = computeInventoryValue(folders, items);
  const threshold = readExpiringThreshold();
  const expiringCount = items.filter((item) => {
    const days = daysUntilExpiration(item.expirationDate, exportedAt);
    return days !== null && days <= threshold;
  }).length;

  type PageCtx = {
    page: ReturnType<typeof pdf.addPage>;
    y: number;
  };

  let ctx: PageCtx = {
    page: pdf.addPage([pageWidth, pageHeight]),
    y: pageHeight - marginTop,
  };

  const color = (c: { r: number; g: number; b: number }) => rgb(c.r, c.g, c.b);

  const drawRunningHeader = () => {
    ctx.page.drawRectangle({
      x: 0,
      y: pageHeight - 6,
      width: pageWidth,
      height: 6,
      color: color(BRAND),
    });
    ctx.page.drawRectangle({
      x: 0,
      y: pageHeight - 10,
      width: pageWidth,
      height: 4,
      color: color(ACCENT),
    });
    ctx.page.drawText(i18n.t("export.brandLine"), {
      x: marginX,
      y: pageHeight - 28,
      size: 9,
      font: bold,
      color: color(BRAND),
    });
    const right = truncate(householdName || i18n.t("export.householdFallback"), regular, 9, 220);
    ctx.page.drawText(right, {
      x: pageWidth - marginX - regular.widthOfTextAtSize(right, 9),
      y: pageHeight - 28,
      size: 9,
      font: regular,
      color: color(MUTED),
    });
    ctx.page.drawLine({
      start: { x: marginX, y: pageHeight - 34 },
      end: { x: marginX + contentWidth, y: pageHeight - 34 },
      thickness: 0.75,
      color: color(LINE),
    });
    ctx.y = pageHeight - 48;
  };

  const newPage = () => {
    ctx = {
      page: pdf.addPage([pageWidth, pageHeight]),
      y: pageHeight - marginTop,
    };
    drawRunningHeader();
  };

  /** @returns true when a new page was started */
  const ensureSpace = (height: number): boolean => {
    if (ctx.y - height >= marginBottom + 12) return false;
    newPage();
    return true;
  };

  const drawTextBlock = (
    text: string,
    size: number,
    font: typeof regular,
    opts?: { color?: typeof TEXT; maxWidth?: number; x?: number }
  ) => {
    const maxWidth = opts?.maxWidth ?? contentWidth;
    const x = opts?.x ?? marginX;
    const c = opts?.color ?? TEXT;
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      ensureSpace(size + 4);
      ctx.page.drawText(line, {
        x,
        y: ctx.y - size,
        size,
        font,
        color: color(c),
      });
      ctx.y -= size + 4;
    }
  };

  const drawTableHeader = (cols: Col[]) => {
    ensureSpace(22);
    ctx.page.drawRectangle({
      x: marginX,
      y: ctx.y - 18,
      width: contentWidth,
      height: 18,
      color: color(BRAND),
    });
    let x = marginX + 6;
    for (const col of cols) {
      const tw = bold.widthOfTextAtSize(col.label, 8);
      const tx = col.align === "right" ? x + col.width - 6 - tw : x;
      ctx.page.drawText(col.label, {
        x: tx,
        y: ctx.y - 12,
        size: 8,
        font: bold,
        color: color(WHITE),
      });
      x += col.width;
    }
    ctx.y -= 20;
  };

  // -- Cover / summary --
  ctx.page.drawRectangle({
    x: 0,
    y: pageHeight - 6,
    width: pageWidth,
    height: 6,
    color: color(BRAND),
  });
  ctx.page.drawRectangle({
    x: 0,
    y: pageHeight - 10,
    width: pageWidth,
    height: 4,
    color: color(ACCENT),
  });
  ctx.y = pageHeight - 36;

  ctx.page.drawRectangle({
    x: marginX,
    y: ctx.y - 52,
    width: contentWidth,
    height: 56,
    color: color(PALE),
  });
  ctx.page.drawRectangle({
    x: marginX,
    y: ctx.y - 52,
    width: 6,
    height: 56,
    color: color(BRAND),
  });
  ctx.page.drawText(i18n.t("app.name"), {
    x: marginX + 18,
    y: ctx.y - 24,
    size: 11,
    font: bold,
    color: color(BRAND),
  });
  ctx.page.drawText(i18n.t("export.reportTitle"), {
    x: marginX + 18,
    y: ctx.y - 44,
    size: 22,
    font: bold,
    color: color(TEXT),
  });
  ctx.y -= 72;

  drawTextBlock(householdName || i18n.t("export.householdFallback"), 14, bold);
  drawTextBlock(i18n.t("export.exportedAt", { when: exportLabel }), 10, regular, { color: MUTED });
  drawTextBlock(i18n.t("export.valueDisclaimer"), 9, regular, { color: MUTED });
  ctx.y -= 10;

  const kpis: { label: string; value: string; hint: string }[] = [
    { label: i18n.t("dashboard.folders"), value: String(folders.length), hint: i18n.t("export.foldersHint") },
    { label: i18n.t("dashboard.items"), value: String(items.length), hint: i18n.t("export.itemsHint") },
    {
      label: i18n.t("dashboard.quantity"),
      value: String(valueSummary.coverage.totalQuantity),
      hint: i18n.t("export.quantityHint"),
    },
    {
      label: i18n.t("dashboard.recordedValue"),
      value:
        valueSummary.coverage.pricedCount > 0
          ? formatMoney(valueSummary.coverage.totalValue)
          : i18n.t("common.dash"),
      hint:
        valueSummary.coverage.itemCount > 0
          ? i18n.t("export.pricedPercent", {
              percent: Math.round(valueSummary.coverage.pricedShare * 100),
            })
          : i18n.t("export.noItemsYet"),
    },
    {
      label: i18n.t("dashboard.missingPrice"),
      value: String(valueSummary.coverage.missingPriceCount),
      hint: i18n.t("export.missingPriceHint"),
    },
    {
      label: i18n.t("search.expiringSoon"),
      value: String(expiringCount),
      hint: i18n.t("export.expiringHint", { count: threshold }),
    },
  ];

  const gap = 10;
  const cardW = (contentWidth - gap * 2) / 3;
  const cardH = 58;
  const kpiRows = Math.ceil(kpis.length / 3);
  ensureSpace(kpiRows * (cardH + gap));
  const kpiTop = ctx.y;
  for (let i = 0; i < kpis.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = marginX + col * (cardW + gap);
    const top = kpiTop - row * (cardH + gap);
    const kpi = kpis[i]!;
    ctx.page.drawRectangle({
      x,
      y: top - cardH,
      width: cardW,
      height: cardH,
      color: color(WHITE),
      borderColor: color(LINE),
      borderWidth: 1,
    });
    ctx.page.drawRectangle({
      x,
      y: top - 4,
      width: cardW,
      height: 4,
      color: color(ACCENT),
    });
    ctx.page.drawText(kpi.label.toUpperCase(), {
      x: x + 10,
      y: top - 18,
      size: 7,
      font: bold,
      color: color(MUTED),
    });
    ctx.page.drawText(truncate(kpi.value, bold, 16, cardW - 20), {
      x: x + 10,
      y: top - 36,
      size: 16,
      font: bold,
      color: color(BRAND),
    });
    ctx.page.drawText(truncate(kpi.hint, regular, 8, cardW - 20), {
      x: x + 10,
      y: top - 50,
      size: 8,
      font: regular,
      color: color(MUTED),
    });
  }
  ctx.y = kpiTop - kpiRows * (cardH + gap) - 4;

  ensureSpace(28);
  drawTextBlock(i18n.t("export.foldersInReport"), 12, bold);
  ctx.y -= 4;

  const byFolderMap = new Map<string | null, Item[]>();
  for (const item of items) {
    const list = byFolderMap.get(item.folderId) ?? [];
    list.push(item);
    byFolderMap.set(item.folderId, list);
  }

  const folderOrder: { id: string | null; name: string; category: string; items: Item[] }[] = [
    ...folders
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category
          ? i18n.t(`categories.${f.category}`, { defaultValue: f.category })
          : i18n.t("inventory.uncategorized"),
        items: (byFolderMap.get(f.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      })),
  ];
  const independent = byFolderMap.get(null) ?? [];
  if (independent.length > 0) {
    folderOrder.push({
      id: null,
      name: i18n.t("inventory.independent"),
      category: i18n.t("export.outsideFolders"),
      items: independent.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  const indexCols: Col[] = [
    { label: i18n.t("export.colFolder"), width: contentWidth * 0.34 },
    { label: i18n.t("export.colCategory"), width: contentWidth * 0.28 },
    { label: i18n.t("export.colItems"), width: contentWidth * 0.12, align: "right" },
    { label: i18n.t("export.colQty"), width: contentWidth * 0.12, align: "right" },
    { label: i18n.t("export.colValue"), width: contentWidth * 0.14, align: "right" },
  ];

  drawTableHeader(indexCols);

  folderOrder.forEach((folder, idx) => {
    const qty = folder.items.reduce((sum, it) => sum + itemQuantity(it), 0);
    let value = 0;
    let priced = 0;
    for (const it of folder.items) {
      const lv = lineValue(it);
      if (lv !== null) {
        value += lv;
        priced += 1;
      }
    }
    const cells = [
      folder.name,
      folder.category,
      String(folder.items.length),
      String(qty),
      priced > 0 ? formatMoney(value) : i18n.t("common.dash"),
    ];
    ensureSpace(16);
    if (idx % 2 === 1) {
      ctx.page.drawRectangle({
        x: marginX,
        y: ctx.y - 14,
        width: contentWidth,
        height: 14,
        color: color(ROW_ALT),
      });
    }
    let x = marginX + 6;
    cells.forEach((cell, i) => {
      const col = indexCols[i]!;
      const text = truncate(cell, regular, 9, col.width - 10);
      const tw = regular.widthOfTextAtSize(text, 9);
      const tx = col.align === "right" ? x + col.width - 6 - tw : x;
      ctx.page.drawText(text, {
        x: tx,
        y: ctx.y - 11,
        size: 9,
        font: i === 0 ? bold : regular,
        color: color(TEXT),
      });
      x += col.width;
    });
    ctx.y -= 15;
  });

  if (items.length === 0) {
    ctx.y -= 8;
    drawTextBlock(i18n.t("export.noItemsInHousehold"), 11, regular, { color: MUTED });
  }

  // Top value concentrations (when useful)
  if (valueSummary.byCategory.length > 0 && valueSummary.coverage.pricedCount > 0) {
    ctx.y -= 12;
    ensureSpace(40);
    drawTextBlock(i18n.t("export.valueByCategory"), 12, bold);
    ctx.y -= 2;
    const topCats = valueSummary.byCategory.slice(0, 8);
    for (const row of topCats) {
      ensureSpace(14);
      const label = truncate(
        `${row.label}  ${formatMoney(row.totalValue)}  (${Math.round(row.share * 100)}%)`,
        regular,
        9,
        contentWidth * 0.4
      );
      ctx.page.drawText(label, {
        x: marginX,
        y: ctx.y - 10,
        size: 9,
        font: regular,
        color: color(TEXT),
      });
      const barX = marginX + contentWidth * 0.42;
      const barW = contentWidth * 0.58;
      ctx.page.drawRectangle({
        x: barX,
        y: ctx.y - 12,
        width: barW,
        height: 8,
        color: color(PALE),
      });
      ctx.page.drawRectangle({
        x: barX,
        y: ctx.y - 12,
        width: Math.max(2, barW * row.share),
        height: 8,
        color: color(BRAND),
      });
      ctx.y -= 14;
    }
  }

  // -- Detail sections --
  const detailCols: Col[] = [
    { label: i18n.t("export.colItem"), width: contentWidth * 0.26 },
    { label: i18n.t("export.colQty"), width: contentWidth * 0.07, align: "right" },
    { label: i18n.t("export.colValue"), width: contentWidth * 0.12, align: "right" },
    { label: i18n.t("export.colLocation"), width: contentWidth * 0.15 },
    { label: i18n.t("export.colPurchased"), width: contentWidth * 0.12 },
    { label: i18n.t("export.colExpires"), width: contentWidth * 0.12 },
    { label: i18n.t("export.colTags"), width: contentWidth * 0.16 },
  ];

  for (const folder of folderOrder) {
    if (folder.items.length === 0) continue;

    newPage();

    let sectionValue = 0;
    let sectionQty = 0;
    for (const it of folder.items) {
      sectionQty += itemQuantity(it);
      const lv = lineValue(it);
      if (lv !== null) sectionValue += lv;
    }

    ensureSpace(44);
    ctx.page.drawRectangle({
      x: marginX,
      y: ctx.y - 36,
      width: contentWidth,
      height: 36,
      color: color(PALE),
    });
    ctx.page.drawText(truncate(folder.name, bold, 13, contentWidth * 0.55), {
      x: marginX + 10,
      y: ctx.y - 16,
      size: 13,
      font: bold,
      color: color(BRAND),
    });
    const meta = i18n.t("export.folderMeta", {
      category: folder.category,
      items: i18n.t("common.item", { count: folder.items.length }),
      qty: sectionQty,
      value: sectionValue > 0 ? formatMoney(sectionValue) : i18n.t("export.noPricedValue"),
    });
    ctx.page.drawText(truncate(meta, regular, 9, contentWidth - 24), {
      x: marginX + 10,
      y: ctx.y - 30,
      size: 9,
      font: regular,
      color: color(MUTED),
    });
    ctx.y -= 48;

    drawTableHeader(detailCols);

    folder.items.forEach((item, idx) => {
      const lv = lineValue(item);
      const days = daysUntilExpiration(item.expirationDate, exportedAt);
      const expLabel = !item.expirationDate
        ? i18n.t("common.dash")
        : days !== null && days < 0
          ? i18n.t("export.overdueSuffix", { date: item.expirationDate })
          : item.expirationDate;
      const cells = [
        item.name,
        String(itemQuantity(item)),
        lv === null ? i18n.t("common.dash") : formatMoney(lv),
        item.location?.trim() || i18n.t("common.dash"),
        item.purchaseDate || i18n.t("common.dash"),
        expLabel,
        item.tags?.length ? item.tags.join(", ") : i18n.t("common.dash"),
      ];

      const rowH = 15;
      if (ensureSpace(rowH + 2)) {
        // Fresh page mid-table: repeat header for readability on large inventories
        drawTableHeader(detailCols);
      }
      if (idx % 2 === 1) {
        ctx.page.drawRectangle({
          x: marginX,
          y: ctx.y - rowH + 2,
          width: contentWidth,
          height: rowH,
          color: color(ROW_ALT),
        });
      }

      let x = marginX + 6;
      cells.forEach((cell, i) => {
        const col = detailCols[i]!;
        const isAlert = i === 5 && days !== null && days < 0;
        const text = truncate(cell, regular, 8, col.width - 10);
        const tw = regular.widthOfTextAtSize(text, 8);
        const tx = col.align === "right" ? x + col.width - 6 - tw : x;
        ctx.page.drawText(text, {
          x: tx,
          y: ctx.y - 10,
          size: 8,
          font: i === 0 ? bold : regular,
          color: color(isAlert ? DANGER : TEXT),
        });
        x += col.width;
      });
      ctx.y -= rowH;
    });
  }

  // Footers
  const pages = pdf.getPages();
  const totalPages = pages.length;
  pages.forEach((page, index) => {
    const label = i18n.t("export.pageOf", { current: index + 1, total: totalPages });
    page.drawLine({
      start: { x: marginX, y: footerY + 12 },
      end: { x: marginX + contentWidth, y: footerY + 12 },
      thickness: 0.6,
      color: color(LINE),
    });
    page.drawText(i18n.t("export.footerBrand"), {
      x: marginX,
      y: footerY,
      size: 8,
      font: regular,
      color: color(MUTED),
    });
    page.drawText(label, {
      x: pageWidth - marginX - regular.widthOfTextAtSize(label, 8),
      y: footerY,
      size: 8,
      font: regular,
      color: color(MUTED),
    });
  });

  return pdf.save();
}
