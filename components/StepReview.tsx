"use client";

import { calculate } from "@/lib/calc";
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
  const calc = calculate(input, directions);
  const byKey = Object.fromEntries(calc.perDirection.map((d) => [d.key, d]));

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

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gray mb-2">
          Направления
        </h3>
        <div className="space-y-2">
          {directions.map((d) => {
            const c = byKey[d.key];
            return (
              <div
                key={d.key}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  d.included
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50 text-brand-gray"
                }`}
              >
                <div>
                  <span className="font-semibold">{d.name}</span>{" "}
                  {d.included ? (
                    <span className="text-brand-gray">
                      · {d.works.length} работ
                    </span>
                  ) : (
                    <span className="text-xs rounded-full bg-gray-200 px-2 py-0.5">
                      не входит
                    </span>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  {d.included ? (
                    <>
                      <span className="font-semibold">
                        {formatMoney(c.monthlyPrice)}
                      </span>
                      <span className="text-brand-gray text-xs ml-2">
                        {formatHours(c.monthlyHours)}/мес
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
