"use client";

import { useMemo, useState } from "react";
import {
  COEF_GROUPS,
  cloneCalcConfig,
  type CalcConfig,
} from "@/lib/calc-config";
import { DIRECTION_NAME, DIRECTION_ORDER } from "@/lib/seo-config";
import type { CoefficientKey, DirectionKey } from "@/lib/types";

/**
 * Черновик формы: все числовые поля живут строками, иначе промежуточный ввод
 * («1,» или пустое поле) невозможно набрать. В конфиг превращается при сохранении
 * (`fromDraft`), там же собираются понятные ошибки.
 */
interface CalcDraft {
  baseCost: string;
  hourRate: string;
  directionCoef: Record<DirectionKey, string>;
  directionCoefficients: Record<DirectionKey, CoefficientKey[]>;
  bundle: {
    trigger: DirectionKey;
    discounted: DirectionKey[];
    /** Скидка в процентах — так привычнее, чем доля 0..1. */
    ratePercent: string;
  };
  coef: Record<CoefficientKey, Record<string, string>>;
}

const numStr = (n: number) => String(n);

function toDraft(cfg: CalcConfig): CalcDraft {
  return {
    baseCost: numStr(cfg.baseCost),
    hourRate: numStr(cfg.hourRate),
    directionCoef: Object.fromEntries(
      DIRECTION_ORDER.map((k) => [k, numStr(cfg.directionCoef[k])]),
    ) as Record<DirectionKey, string>,
    directionCoefficients: Object.fromEntries(
      DIRECTION_ORDER.map((k) => [k, [...cfg.directionCoefficients[k]]]),
    ) as Record<DirectionKey, CoefficientKey[]>,
    bundle: {
      trigger: cfg.bundle.trigger,
      discounted: [...cfg.bundle.discounted],
      ratePercent: numStr(Math.round(cfg.bundle.rate * 1000) / 10),
    },
    coef: Object.fromEntries(
      COEF_GROUPS.map((g) => [
        g.key,
        Object.fromEntries(
          g.options.map((o) => [
            o,
            numStr((cfg.coef[g.key] as Record<string, number>)[o]),
          ]),
        ),
      ]),
    ) as Record<CoefficientKey, Record<string, string>>,
  };
}

/** Положительное число из строки («1,4» тоже принимаем). */
function parsePositive(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fromDraft(draft: CalcDraft): { config?: CalcConfig; errors: string[] } {
  const errors: string[] = [];
  const need = (raw: string, label: string): number => {
    const n = parsePositive(raw);
    if (n === null) {
      errors.push(`${label}: нужно положительное число`);
      return 1;
    }
    return n;
  };

  const percent = Number(draft.bundle.ratePercent.replace(",", ".").trim());
  if (!Number.isFinite(percent) || percent < 0 || percent >= 100) {
    errors.push("Пакетная скидка: процент должен быть от 0 до 99,9");
  }

  const config: CalcConfig = {
    baseCost: need(draft.baseCost, "Базовая стоимость"),
    hourRate: need(draft.hourRate, "Стоимость часа"),
    directionCoef: Object.fromEntries(
      DIRECTION_ORDER.map((k) => [
        k,
        need(draft.directionCoef[k], `Коэффициент «${DIRECTION_NAME[k]}»`),
      ]),
    ) as Record<DirectionKey, number>,
    directionCoefficients: Object.fromEntries(
      DIRECTION_ORDER.map((k) => [k, [...draft.directionCoefficients[k]]]),
    ) as Record<DirectionKey, CoefficientKey[]>,
    bundle: {
      trigger: draft.bundle.trigger,
      discounted: draft.bundle.discounted.filter(
        (k) => k !== draft.bundle.trigger,
      ),
      rate: Number.isFinite(percent)
        ? Number((Math.max(0, percent) / 100).toFixed(4))
        : 0,
    },
    coef: Object.fromEntries(
      COEF_GROUPS.map((g) => [
        g.key,
        Object.fromEntries(
          g.options.map((o) => [
            o,
            need(draft.coef[g.key][o], `${g.title} → «${o}»`),
          ]),
        ),
      ]),
    ) as unknown as CalcConfig["coef"],
  };

  return errors.length > 0 ? { errors } : { config, errors };
}

export default function SettingsCalc({
  initialConfig,
}: {
  initialConfig: CalcConfig;
}) {
  const [saved, setSaved] = useState<CalcConfig>(() =>
    cloneCalcConfig(initialConfig),
  );
  const [draft, setDraft] = useState<CalcDraft>(() => toDraft(initialConfig));
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(toDraft(saved)),
    [draft, saved],
  );

  const patch = (fn: (d: CalcDraft) => CalcDraft) => {
    setDraft(fn);
    setDone(null);
  };

  const setCoef = (group: CoefficientKey, option: string, value: string) =>
    patch((d) => ({
      ...d,
      coef: { ...d.coef, [group]: { ...d.coef[group], [option]: value } },
    }));

  const toggleApplies = (key: DirectionKey, coef: CoefficientKey) =>
    patch((d) => {
      const cur = d.directionCoefficients[key];
      const next = cur.includes(coef)
        ? cur.filter((c) => c !== coef)
        : COEF_GROUPS.map((g) => g.key).filter(
            (c) => cur.includes(c) || c === coef,
          );
      return {
        ...d,
        directionCoefficients: { ...d.directionCoefficients, [key]: next },
      };
    });

  const save = async () => {
    const { config, errors: issues } = fromDraft(draft);
    setErrors(issues);
    if (!config) return;
    setBusy("save");
    setDone(null);
    try {
      const res = await fetch("/api/settings/calc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Ошибка сервера (${res.status})`);
      setSaved(data.config as CalcConfig);
      setDraft(toDraft(data.config as CalcConfig));
      setDone("Настройки сохранены");
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Не удалось сохранить"]);
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    if (
      !confirm(
        "Вернуть все значения расчёта к значениям по умолчанию (из Расчет SEO.xlsx)?",
      )
    )
      return;
    setBusy("reset");
    setErrors([]);
    setDone(null);
    try {
      const res = await fetch("/api/settings/calc", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Ошибка сервера (${res.status})`);
      setSaved(data.config as CalcConfig);
      setDraft(toDraft(data.config as CalcConfig));
      setDone("Значения сброшены к значениям по умолчанию");
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Не удалось сбросить"]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Note>
        <b>Как считается стоимость.</b> Цена направления за месяц ={" "}
        <b>базовая стоимость</b> × <b>коэффициент направления</b> × произведение
        отмеченных <b>коэффициентов параметров</b>, с округлением до целого. Часы
        = цена ÷ стоимость часа. Итог за срок — сумма помесячных итогов.
        <br />
        Изменения действуют на <b>новые</b> КП: каждое сохранённое КП хранит копию
        этих настроек, поэтому его PDF и Excel не меняются задним числом. Чтобы
        пересчитать старое КП — импортируйте его JSON заново.
      </Note>

      {/* --- Базовые ставки --- */}
      <Section
        title="Базовые ставки"
        hint="Отправная точка расчёта — в BYN."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Базовая стоимость SEO, BYN / мес"
            hint="Сумма, от которой считается каждое направление до применения коэффициентов."
            value={draft.baseCost}
            onChange={(v) => patch((d) => ({ ...d, baseCost: v }))}
          />
          <NumberField
            label="Стоимость часа, BYN"
            hint="Из неё получается объём работ: часы = цена направления ÷ стоимость часа. На саму цену не влияет."
            value={draft.hourRate}
            onChange={(v) => patch((d) => ({ ...d, hourRate: v }))}
          />
        </div>
      </Section>

      {/* --- Направления --- */}
      <Section
        title="Направления"
        hint="Коэффициент направления — во сколько раз оно дороже базовой стоимости (1,4 = +40%). Галочки задают, какие коэффициенты параметров участвуют в формуле этого направления; снятая галочка = коэффициент не применяется."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-brand-green text-white">
                <th className="text-left font-semibold px-3 py-2 rounded-l-lg">
                  Направление
                </th>
                <th className="font-semibold px-3 py-2 w-28">Коэф.</th>
                {COEF_GROUPS.map((g) => (
                  <th
                    key={g.key}
                    className="font-semibold px-2 py-2 text-center text-xs last:rounded-r-lg"
                    title={g.title}
                  >
                    {g.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIRECTION_ORDER.map((key) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium">
                    {DIRECTION_NAME[key]}
                  </td>
                  <td className="px-3 py-2">
                    <NumInput
                      value={draft.directionCoef[key]}
                      onChange={(v) =>
                        patch((d) => ({
                          ...d,
                          directionCoef: { ...d.directionCoef, [key]: v },
                        }))
                      }
                    />
                  </td>
                  {COEF_GROUPS.map((g) => (
                    <td key={g.key} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-green cursor-pointer"
                        checked={draft.directionCoefficients[key].includes(
                          g.key,
                        )}
                        onChange={() => toggleApplies(key, g.key)}
                        title={`${DIRECTION_NAME[key]} · ${g.title}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* --- Пакетная скидка --- */}
      <Section
        title="Пакетная скидка"
        hint="Если направление-триггер активно в каком-то месяце, то выбранные направления в этом же месяце считаются со скидкой. В КП скидка показывается клиенту отдельной строкой."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">
              Направление-триггер
            </span>
            <select
              className="ui-input"
              value={draft.bundle.trigger}
              onChange={(e) =>
                patch((d) => ({
                  ...d,
                  bundle: {
                    ...d.bundle,
                    trigger: e.target.value as DirectionKey,
                    discounted: d.bundle.discounted.filter(
                      (k) => k !== (e.target.value as DirectionKey),
                    ),
                  },
                }))
              }
            >
              {DIRECTION_ORDER.map((k) => (
                <option key={k} value={k}>
                  {DIRECTION_NAME[k]}
                </option>
              ))}
            </select>
            <span className="block text-xs text-brand-gray mt-1">
              Скидка включается, когда это направление входит в месяц.
            </span>
          </label>

          <div className="md:col-span-2">
            <span className="block text-sm font-medium mb-1.5">
              Со скидкой считаются
            </span>
            <div className="flex flex-wrap gap-2">
              {DIRECTION_ORDER.filter((k) => k !== draft.bundle.trigger).map(
                (k) => {
                  const on = draft.bundle.discounted.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        patch((d) => ({
                          ...d,
                          bundle: {
                            ...d.bundle,
                            discounted: on
                              ? d.bundle.discounted.filter((x) => x !== k)
                              : [...d.bundle.discounted, k],
                          },
                        }))
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        on
                          ? "border-brand-green bg-brand-green text-white"
                          : "border-gray-300 bg-white hover:border-brand-green"
                      }`}
                    >
                      {DIRECTION_NAME[k]}
                    </button>
                  );
                },
              )}
            </div>
            <div className="mt-4 max-w-[200px]">
              <NumberField
                label="Размер скидки, %"
                value={draft.bundle.ratePercent}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    bundle: { ...d.bundle, ratePercent: v },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </Section>

      {/* --- Коэффициенты параметров --- */}
      <Section
        title="Коэффициенты параметров проекта"
        hint="Множители по ответам из первого шага визарда. 1,0 — не влияет; 1,2 — дороже на 20%; 0,9 — дешевле на 10%. Сами варианты ответов задаются в коде (lib/seo-config.ts)."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COEF_GROUPS.map((g) => (
            <div
              key={g.key}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="font-semibold text-sm">{g.title}</div>
              <p className="text-xs text-brand-gray mt-1 mb-3">{g.hint}</p>
              <div className="space-y-2">
                {g.options.map((o) => (
                  <div
                    key={o}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm">{o}</span>
                    <NumInput
                      value={draft.coef[g.key][o]}
                      onChange={(v) => setCoef(g.key, o, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          <div className="font-semibold mb-1">Не сохранено:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Панель действий липкая, но остаётся карточкой в ширину контента:
          на узких экранах отрицательные поля растягивали её до краёв окна. */}
      <div className="sticky bottom-4 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy !== null || !dirty}
          className="ui-btn-primary"
        >
          {busy === "save" ? "Сохранение…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={busy !== null}
          className="ui-btn-ghost"
        >
          {busy === "reset" ? "Сброс…" : "Сбросить к значениям по умолчанию"}
        </button>
        {dirty ? (
          <span className="text-sm text-brand-gray">Есть несохранённые изменения</span>
        ) : (
          done && (
            <span className="text-sm text-brand-greenDark font-medium">
              {done}
            </span>
          )
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-bold">{title}</h3>
      {hint && <p className="text-sm text-brand-gray mt-1 mb-4">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-note">
      {children}
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ui-input"
      />
      {hint && <span className="block text-xs text-brand-gray mt-1">{hint}</span>}
    </label>
  );
}

function NumInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ui-input w-20 text-right px-2 py-1"
    />
  );
}
