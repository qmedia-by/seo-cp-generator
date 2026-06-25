// Сборка Excel-файла КП (план + стоимость) на exceljs.
// Повторяет логику Расчет SEO.xlsx: ставки, коэффициенты параметров и блок «Оценка проекта».

import ExcelJS from "exceljs";
import { calculate } from "../calc";
import { BRAND, COMPANY } from "../company";
import {
  AUDIENCE_COEF,
  BASE_COST,
  COMPETITION_COEF,
  CURRENCY,
  DIRECTION_COEF,
  ERRORS_COEF,
  EXPERIENCE_COEF,
  HOUR_RATE,
  LINK_BUILDING_COEF,
  PAGES_COEF,
  REGION_COEF,
} from "../seo-config";
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
  const calc = calculate(input, directions);
  const money = `# ##0.00 "${CURRENCY}"`;

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
  ws.addRow([]);

  // Базовые ставки и коэффициенты параметров
  sectionRow(ws, "Ставки и коэффициенты");
  const coefHeader = ws.addRow(["Параметр", "Значение", "Коэффициент"]);
  coefHeader.eachCell((c, col) => {
    if (col <= 3) headerFill(c);
  });

  ws.addRow(["Базовая стоимость SEO", BASE_COST, ""]);
  ws.addRow(["Стоимость часа", HOUR_RATE, ""]);
  ws.addRow(["Регион", input.region, REGION_COEF[input.region]]);
  ws.addRow(["Для кого", input.audience, AUDIENCE_COEF[input.audience]]);
  ws.addRow(["Что продвигаем", input.promoteType, "—"]);
  ws.addRow(["Количество страниц", input.pages, PAGES_COEF[input.pages]]);
  ws.addRow(["Наличие ошибок", input.errors, ERRORS_COEF[input.errors]]);
  ws.addRow([
    "Предыдущий опыт",
    input.experience,
    EXPERIENCE_COEF[input.experience],
  ]);
  ws.addRow([
    "Ссылочное продвижение",
    input.linkBuilding,
    LINK_BUILDING_COEF[input.linkBuilding],
  ]);
  ws.addRow([
    "Конкуренция",
    input.competition,
    COMPETITION_COEF[input.competition],
  ]);
  ws.addRow(["Срок продвижения", `${input.durationMonths} мес`, "—"]);
  ws.addRow([]);

  // Оценка проекта
  sectionRow(ws, "Оценка проекта (за месяц)");
  const estHeader = ws.addRow([
    "Направление",
    "Статус",
    "Коэф. напр.",
    "Полная цена/мес",
    "Скидка/мес",
    "Цена/мес",
    "Часов/мес",
  ]);
  estHeader.eachCell((c, col) => {
    if (col <= 7) headerFill(c);
  });

  for (const d of calc.perDirection) {
    const discount = d.included ? d.monthlyPrice - d.fullMonthlyPrice : 0; // ≤ 0
    const row = ws.addRow([
      d.discountRate > 0
        ? `${d.name} (−${Math.round(d.discountRate * 100)}%)`
        : d.name,
      d.included ? "включено" : "не входит",
      DIRECTION_COEF[d.key],
      d.included ? d.fullMonthlyPrice : 0,
      discount,
      d.included ? d.monthlyPrice : 0,
      d.included ? d.monthlyHours : 0,
    ]);
    row.getCell(4).numFmt = money;
    row.getCell(5).numFmt = money;
    row.getCell(6).numFmt = money;
    if (!d.included) row.font = { color: { argb: "FF999999" } };
  }

  const totalRow = ws.addRow([
    "Итого за месяц",
    "",
    "",
    calc.monthlyTotalFullPrice,
    -calc.monthlyDiscount,
    calc.monthlyTotalPrice,
    calc.monthlyTotalHours,
  ]);
  totalRow.font = { bold: true };
  totalRow.getCell(4).numFmt = money;
  totalRow.getCell(5).numFmt = money;
  totalRow.getCell(6).numFmt = money;

  ws.addRow([]);
  const durRow = ws.addRow(["Срок продвижения", `${input.durationMonths} мес`]);
  durRow.font = { bold: true };

  const fullTermPrice = calc.monthlyTotalFullPrice * input.durationMonths;
  const termDiscount = calc.monthlyDiscount * input.durationMonths;
  const grandRow = ws.addRow([
    `Итого за ${input.durationMonths} мес`,
    "",
    "",
    fullTermPrice,
    -termDiscount,
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

  // --- Лист 2: План работ ---
  const wp = wb.addWorksheet("План работ");
  wp.columns = [{ width: 6 }, { width: 110 }];
  titleCell(wp.getCell("A1"), "План работ по направлениям");
  wp.addRow([]);

  for (const d of directions) {
    const head = wp.addRow([
      "",
      `${d.name} — ${d.included ? "включено" : "НЕ входит в продвижение"}`,
    ]);
    head.getCell(2).font = {
      bold: true,
      size: 12,
      color: { argb: d.included ? WHITE : INK },
    };
    head.getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: d.included ? GREEN : "FFEDEDED" },
    };
    wp.addRow(["", d.goal]).getCell(2).font = {
      italic: true,
      color: { argb: "FF666666" },
    };
    if (d.included) {
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
