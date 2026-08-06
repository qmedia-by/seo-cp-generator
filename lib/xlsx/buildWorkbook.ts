// Сборка Excel-файла КП (план + стоимость) на exceljs.
// Повторяет логику Расчет SEO.xlsx: ставки, коэффициенты параметров и блок «Оценка проекта».

import ExcelJS from "exceljs";
import { calculateSchedule } from "../calc";
import { mergeCalcConfig } from "../calc-config";
import { BRAND, COMPANY } from "../company";
import { CURRENCY } from "../seo-config";
import type { Proposal } from "../types";

// Фирстиль Qmedia: зелёный — основной (шапки/секции), жёлтый — акцент (итог).
const argb = (hex: string) => "FF" + hex.slice(1);
const GREEN = argb(BRAND.green);
const GREEN_DARK = argb(BRAND.greenDark);
const GREEN_TINT = argb(BRAND.greenTint);
const YELLOW = argb(BRAND.yellow);
const INK = argb(BRAND.ink);
const WHITE = "FFFFFFFF";

function titleCell(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = { bold: true, size: 14, color: { argb: GREEN_DARK } };
}

function headerFill(cell: ExcelJS.Cell) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  cell.font = { bold: true, color: { argb: WHITE } };
}

function sectionRow(ws: ExcelJS.Worksheet, label: string) {
  const row = ws.addRow([label]);
  row.font = { bold: true, color: { argb: WHITE } };
  row.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: GREEN_DARK },
  };
  return row;
}

export async function buildWorkbook(proposal: Proposal): Promise<Buffer> {
  const { input, directions } = proposal;
  // Ставки и коэффициенты берём из снимка настроек этого КП (см. Proposal.calcConfig),
  // чтобы Excel и PDF одного КП всегда сходились между собой.
  const cfg = mergeCalcConfig(proposal.calcConfig);
  const calc = calculateSchedule(input, directions, cfg);
  const money = `# ##0.00 "${CURRENCY}"`;
  const monthNums = calc.months.map((m) => m.month);

  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY.name;
  wb.created = new Date();

  // --- Лист 1: Расчёт ---
  const ws = wb.addWorksheet("Расчёт", {
    views: [{ state: "frozen", ySplit: 0 }],
  });
  ws.columns = [
    { width: 34 }, // Направление / Параметр
    { width: 20 }, // Статус / Значение
    { width: 14 }, // Коэф. напр. / Коэффициент
    { width: 16 }, // Полная цена/мес
    { width: 14 }, // Скидка/мес
    { width: 16 }, // Цена/мес
    { width: 12 }, // Часов/мес
  ];

  titleCell(ws.getCell("A1"), "Коммерческое предложение по SEO");
  ws.getCell("A2").value = `${COMPANY.name} · ${COMPANY.site}`;
  ws.getCell("A2").font = { color: { argb: "FF666666" } };
  ws.addRow([]);

  ws.addRow(["Сайт:", input.siteName]);
  ws.addRow(["Дата:", new Date(proposal.createdAt).toLocaleString("ru-RU")]);
  if (proposal.meta?.clientName)
    ws.addRow(["Клиент:", proposal.meta.clientName]);
  const manager = proposal.manager?.name ? proposal.manager : COMPANY.manager;
  ws.addRow([
    "Менеджер:",
    [manager.name, manager.role].filter(Boolean).join(" · "),
  ]);
  const managerContacts = [manager.phone, manager.email]
    .filter(Boolean)
    .join(" · ");
  if (managerContacts) ws.addRow(["Контакты:", managerContacts]);
  ws.addRow([]);

  // Базовые ставки и коэффициенты параметров
  sectionRow(ws, "Ставки и коэффициенты");
  const coefHeader = ws.addRow(["Параметр", "Значение", "Коэффициент"]);
  coefHeader.eachCell((c, col) => {
    if (col <= 3) headerFill(c);
  });

  ws.addRow(["Базовая стоимость SEO", cfg.baseCost, ""]);
  ws.addRow(["Стоимость часа", cfg.hourRate, ""]);
  ws.addRow(["Регион", input.region, cfg.coef.region[input.region]]);
  ws.addRow(["Для кого", input.audience, cfg.coef.audience[input.audience]]);
  ws.addRow(["Что продвигаем", input.promoteType, "—"]);
  ws.addRow(["Количество страниц", input.pages, cfg.coef.pages[input.pages]]);
  ws.addRow(["Наличие ошибок", input.errors, cfg.coef.errors[input.errors]]);
  ws.addRow([
    "Предыдущий опыт",
    input.experience,
    cfg.coef.experience[input.experience],
  ]);
  ws.addRow([
    "Ссылочное продвижение",
    input.linkBuilding,
    cfg.coef.linkBuilding[input.linkBuilding],
  ]);
  ws.addRow([
    "Конкуренция",
    input.competition,
    cfg.coef.competition[input.competition],
  ]);
  ws.addRow(["Срок продвижения", `${input.durationMonths} мес`, "—"]);
  ws.addRow([]);

  // Оценка проекта (за весь срок)
  sectionRow(ws, "Оценка проекта (за весь срок)");
  const estHeader = ws.addRow([
    "Направление",
    "Месяцы",
    "Коэф. напр.",
    "Полная цена за срок",
    "Скидка за срок",
    "Цена за срок",
    "Часов за срок",
  ]);
  estHeader.eachCell((c, col) => {
    if (col <= 7) headerFill(c);
  });

  for (const d of calc.perDirection) {
    const included = d.activeMonths.length > 0;
    const discount = included ? d.totalPrice - d.totalFullPrice : 0; // ≤ 0
    const row = ws.addRow([
      d.name,
      included ? d.monthsLabel : "не входит",
      cfg.directionCoef[d.key],
      included ? d.totalFullPrice : 0,
      discount,
      included ? d.totalPrice : 0,
      included ? d.totalHours : 0,
    ]);
    row.getCell(4).numFmt = money;
    row.getCell(5).numFmt = money;
    row.getCell(6).numFmt = money;
    if (!included) row.font = { color: { argb: "FF999999" } };
  }

  ws.addRow([]);
  const durRow = ws.addRow(["Срок продвижения", `${input.durationMonths} мес`]);
  durRow.font = { bold: true };

  const grandRow = ws.addRow([
    `Итого за ${input.durationMonths} мес`,
    "",
    "",
    calc.totalFullPrice,
    -calc.totalDiscount,
    calc.totalPrice,
    calc.totalHours,
  ]);
  grandRow.font = { bold: true, size: 12, color: { argb: INK } };
  grandRow.eachCell((c, col) => {
    if (col <= 7)
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: YELLOW },
      };
  });
  grandRow.getCell(4).numFmt = money;
  grandRow.getCell(5).numFmt = money;
  grandRow.getCell(6).numFmt = money;
  ws.addRow([]);

  // Матрица «направления × месяцы»
  sectionRow(ws, "Помесячный график");
  const mtxHeader = ws.addRow([
    "Направление",
    ...monthNums.map((m) => `М${m}`),
  ]);
  mtxHeader.eachCell((c, col) => {
    if (col <= monthNums.length + 1) headerFill(c);
    if (col >= 2) c.alignment = { horizontal: "center" };
  });

  for (const d of calc.perDirection) {
    const active = new Set(d.activeMonths);
    const row = ws.addRow([
      d.name,
      ...monthNums.map((m) => (active.has(m) ? "✓" : "")),
    ]);
    for (let col = 2; col <= monthNums.length + 1; col++) {
      const cell = row.getCell(col);
      cell.alignment = { horizontal: "center" };
      cell.font = { bold: true, color: { argb: GREEN_DARK } };
    }
    if (d.activeMonths.length === 0)
      row.getCell(1).font = { color: { argb: "FF999999" } };
  }

  const mtxPriceRow = ws.addRow([
    "Стоимость / мес",
    ...calc.months.map((m) => m.monthlyTotalPrice),
  ]);
  mtxPriceRow.font = { bold: true };
  for (let col = 2; col <= monthNums.length + 1; col++) {
    mtxPriceRow.getCell(col).numFmt = money;
  }

  const mtxHoursRow = ws.addRow([
    "Часов / мес",
    ...calc.months.map((m) => m.monthlyTotalHours),
  ]);
  for (let col = 2; col <= monthNums.length + 1; col++) {
    mtxHoursRow.getCell(col).alignment = { horizontal: "center" };
  }

  // --- Лист 2: План работ ---
  const wp = wb.addWorksheet("План работ");
  wp.columns = [{ width: 6 }, { width: 110 }];
  titleCell(wp.getCell("A1"), "План работ по направлениям");
  wp.addRow([]);

  const schedByKey = Object.fromEntries(
    calc.perDirection.map((d) => [d.key, d]),
  );
  for (const d of directions) {
    const sd = schedByKey[d.key];
    const included = sd.activeMonths.length > 0;
    const head = wp.addRow([
      "",
      `${d.name} — ${included ? sd.monthsLabel : "НЕ входит в продвижение"}`,
    ]);
    head.getCell(2).font = {
      bold: true,
      size: 12,
      color: { argb: included ? WHITE : INK },
    };
    head.getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: included ? GREEN : "FFEDEDED" },
    };
    wp.addRow(["", d.goal]).getCell(2).font = {
      italic: true,
      color: { argb: "FF666666" },
    };
    if (included) {
      d.works.forEach((w, i) => {
        const r = wp.addRow([i + 1, w.text]);
        r.getCell(2).alignment = { wrapText: true };
      });
    }
    wp.addRow([]);
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
