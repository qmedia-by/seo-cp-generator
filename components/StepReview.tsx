"use client";

import { calculateSchedule } from "@/lib/calc";
import { formatHours, formatMoney } from "@/lib/format";
import type {
  DirectionSelection,
  ProposalInput,
  ProposalMeta,
} from "@/lib/types";

interface Props {
  input: ProposalInput;
  directions: DirectionSelection[];
  meta: ProposalMeta;
  savedId: string | null;
  saving: boolean;
  error: string | null;
  onSave: () => void;
}

export default function StepReview({
  input,
  directions,
  meta,
  savedId,
  saving,
  error,
  onSave,
}: Props) {
  const calc = calculateSchedule(input, directions);
  const byKey = Object.fromEntries(calc.perDirection.map((d) => [d.key, d]));
  const months = calc.months.map((m) => m.month);

  const params: [string, string][] = [
    ["Сайт", input.siteName || "—"],
    ["Регион", input.region],
    ["Срок", `${input.durationMonths} мес`],
    ["Для кого", input.audience],
    ["Что продвигаем", input.promoteType],
    ["Кол-во страниц", input.pages],
    ["Опыт", input.experience],
    ["Ошибки", input.errors],
    ["Ссылочное", input.linkBuilding],
    ["Конкуренция", input.competition],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Предпросмотр и генерация</h2>
        <p className="text-sm text-brand-gray">
          Проверьте состав КП. При сохранении создаётся JSON на сервере, после
          чего доступны PDF и Excel.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gray mb-2">
          Параметры
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm">
          {params.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-brand-gray">{k}</span>
              <span className="font-medium text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Матрица «направления × месяцы» */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gray mb-2">
          График по месяцам
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-brand-green text-white">
                <th className="text-left font-semibold px-3 py-2 rounded-l-lg">
                  Направление
                </th>
                {months.map((m) => (
                  <th key={m} className="w-10 text-center font-semibold px-1 py-2">
                    {m}
                  </th>
                ))}
                <th className="text-right font-semibold px-3 py-2 rounded-r-lg whitespace-nowrap">
                  За срок
                </th>
              </tr>
            </thead>
            <tbody>
              {calc.perDirection.map((d) => {
                const active = new Set(d.activeMonths);
                const included = d.activeMonths.length > 0;
                const discounted = d.totalFullPrice > d.totalPrice;
                return (
                  <tr
                    key={d.key}
                    className={`border-b border-gray-100 ${included ? "" : "text-brand-gray"}`}
                  >
                    <td className="px-3 py-1.5">{d.name}</td>
                    {months.map((m) => (
                      <td key={m} className="text-center px-1 py-1.5">
                        {active.has(m) ? (
                          <span className="text-brand-green font-bold">✓</span>
                        ) : (
                          <span className="text-gray-300">·</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {included ? (
                        <>
                          {discounted && (
                            <span className="text-brand-gray line-through text-xs mr-1.5">
                              {formatMoney(d.totalFullPrice)}
                            </span>
                          )}
                          <span className="font-semibold">
                            {formatMoney(d.totalPrice)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-brand-greenTint font-semibold">
                <td className="px-3 py-2 rounded-l-lg">Стоимость / мес</td>
                {calc.months.map((m) => (
                  <td
                    key={m.month}
                    className="text-center px-1 py-2 text-[10px] text-brand-greenDark"
                  >
                    {Math.round(m.monthlyTotalPrice)}
                  </td>
                ))}
                <td className="px-3 py-2 text-right rounded-r-lg whitespace-nowrap">
                  {formatMoney(calc.totalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Пометки по направлениям */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gray mb-2">
          Направления
        </h3>
        <div className="space-y-2">
          {directions.map((d) => {
            const c = byKey[d.key];
            const included = c.activeMonths.length > 0;
            const discounted = c.totalFullPrice > c.totalPrice;
            return (
              <div
                key={d.key}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  included
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50 text-brand-gray"
                }`}
              >
                <div>
                  <span className="font-semibold">{d.name}</span>{" "}
                  {included ? (
                    <span className="text-brand-gray">
                      · {c.monthsLabel} · {d.works.length} работ
                    </span>
                  ) : (
                    <span className="text-xs rounded-full bg-gray-200 px-2 py-0.5">
                      не входит
                    </span>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  {included ? (
                    <>
                      {discounted && (
                        <span className="text-brand-gray line-through text-xs mr-2">
                          {formatMoney(c.totalFullPrice)}
                        </span>
                      )}
                      <span className="font-semibold">
                        {formatMoney(c.totalPrice)}
                      </span>
                      <span className="text-brand-gray text-xs ml-2">
                        {formatHours(c.totalHours)} за срок
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {meta.notes && (
        <div className="text-sm">
          <span className="text-brand-gray">Заметки: </span>
          {meta.notes}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {savedId ? (
        <div className="rounded-2xl border border-brand-green/40 bg-brand-green/10 p-5">
          <div className="font-bold text-brand-greenDark mb-3">
            КП сохранено ✓
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/proposals/${savedId}/pdf`}
              className="ui-btn-accent"
              target="_blank"
              rel="noreferrer"
            >
              Скачать PDF
            </a>
            <a
              href={`/api/proposals/${savedId}/xlsx`}
              className="ui-btn-primary"
            >
              Скачать Excel
            </a>
            <a href="/" className="ui-btn-ghost">
              К списку КП
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !input.siteName.trim()}
          className="ui-btn-primary text-base px-6 py-3"
        >
          {saving ? "Сохранение…" : "Сохранить и сгенерировать КП"}
        </button>
      )}
      {!savedId && !input.siteName.trim() && (
        <p className="text-xs text-brand-gray -mt-3">
          Укажите название сайта на первом шаге.
        </p>
      )}
    </div>
  );
}
