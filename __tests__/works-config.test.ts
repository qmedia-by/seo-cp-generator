import { describe, expect, it } from "vitest";
import { MIGRATION_IDS } from "../lib/migrations";
import { buildProposal } from "../lib/storage";
import {
  DEFAULT_WORKS_CONFIG,
  MAX_WORKS_PER_DIRECTION,
  buildWorksCatalog,
  mergeWorksConfig,
} from "../lib/works-config";
import { WORKS_CATALOG_BY_KEY } from "../lib/works-catalog";
import type { CreateProposalPayload } from "../lib/validation";

describe("mergeWorksConfig", () => {
  it("без данных отдаёт списки из каталога", () => {
    const cfg = mergeWorksConfig(null);
    expect(cfg.commercial).toEqual(WORKS_CATALOG_BY_KEY.commercial.works);
    expect(cfg.support).toEqual(WORKS_CATALOG_BY_KEY.support.works);
  });

  it("битое направление берёт список по умолчанию, остальные — из данных", () => {
    const cfg = mergeWorksConfig({ commercial: ["Только одна работа"], info: 42 });
    expect(cfg.commercial).toEqual(["Только одна работа"]);
    expect(cfg.info).toEqual(DEFAULT_WORKS_CONFIG.info);
  });

  it("явно пустой список остаётся пустым", () => {
    // «Работ нет» — осмысленная настройка, её нельзя путать с «настройку не трогали».
    expect(mergeWorksConfig({ geo: [] }).geo).toEqual([]);
  });

  it("чистит пробелы, мусор и дубли", () => {
    const cfg = mergeWorksConfig({
      serm: [
        "  Работа   с   лишними пробелами  ",
        "Работа с лишними пробелами",
        "",
        "   ",
        123,
        null,
        "Вторая работа",
      ],
    });
    expect(cfg.serm).toEqual(["Работа с лишними пробелами", "Вторая работа"]);
  });

  it("ограничивает длину списка", () => {
    const many = Array.from(
      { length: MAX_WORKS_PER_DIRECTION + 10 },
      (_, i) => `Работа ${i}`,
    );
    expect(mergeWorksConfig({ info: many }).info).toHaveLength(
      MAX_WORKS_PER_DIRECTION,
    );
  });

  it("не даёт править дефолты через возвращённый объект", () => {
    const cfg = mergeWorksConfig(null);
    cfg.commercial.push("Посторонняя работа");
    expect(DEFAULT_WORKS_CONFIG.commercial).not.toContain("Посторонняя работа");
  });
});

describe("buildWorksCatalog", () => {
  it("берёт работы из настроек, а название и цель — из каталога", () => {
    const catalog = buildWorksCatalog(
      mergeWorksConfig({ commercial: ["Своя работа"] }),
    );
    const commercial = catalog.find((d) => d.key === "commercial")!;
    expect(commercial.works).toEqual(["Своя работа"]);
    expect(commercial.name).toBe(WORKS_CATALOG_BY_KEY.commercial.name);
    expect(commercial.goal).toBe(WORKS_CATALOG_BY_KEY.commercial.goal);
    // Порядок направлений — как в смете.
    expect(catalog.map((d) => d.key)).toEqual([
      "commercial",
      "info",
      "geo",
      "serm",
      "support",
    ]);
  });
});

describe("миграции", () => {
  it("id уникальны и идут по возрастанию", () => {
    // Журнал `schema_migrations` хранит id: дубликат означал бы, что вторая
    // миграция никогда не применится (первая уже отмечена как выполненная).
    expect(new Set(MIGRATION_IDS).size).toBe(MIGRATION_IDS.length);
    expect([...MIGRATION_IDS].sort()).toEqual(MIGRATION_IDS);
  });

  it("каталог работ переносится в БД миграцией", () => {
    expect(MIGRATION_IDS).toContain("0002_seed_works");
  });
});

describe("фиксация работ в КП", () => {
  it("сохраняет тексты работ снимком — правка настроек их не меняет", () => {
    const payload: CreateProposalPayload = {
      input: {
        siteName: "example.by",
        region: "Вся РБ",
        durationMonths: 3,
        audience: "b2b",
        promoteType: "услуги",
        pages: "до 1000",
        experience: "Сайт продвигался",
        errors: "Единичные",
        linkBuilding: "Базово",
        competition: "Средняя",
      },
      directions: [
        {
          key: "commercial",
          name: "Коммерческое SEO",
          goal: "Горячий спрос",
          activeMonths: [1, 2, 3],
          works: [{ text: "Текст на момент создания КП" }],
        },
      ],
    };

    const proposal = buildProposal(payload);
    expect(proposal.directions[0].works).toEqual([
      { text: "Текст на момент создания КП" },
    ]);
  });
});
