"use client";

import { useState } from "react";
import { formatMonthRanges } from "@/lib/format";
import { WORKS_CATALOG_BY_KEY } from "@/lib/works-catalog";
import type { DirectionKey, DirectionSelection, WorkItem } from "@/lib/types";

interface Props {
  directions: DirectionSelection[];
  durationMonths: number;
  onChange: (next: DirectionSelection[]) => void;
}

export default function StepDirections({
  directions,
  durationMonths,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(
    directions[0]?.key ?? null,
  );

  const months = Array.from({ length: durationMonths }, (_, i) => i + 1);

  const updateDirection = (
    key: string,
    patch: Partial<DirectionSelection>,
  ) => {
    onChange(directions.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  const setActiveMonths = (key: DirectionKey, next: number[]) => {
    const sorted = Array.from(new Set(next)).sort((a, b) => a - b);
    updateDirection(key, { activeMonths: sorted });
  };

  const toggleMonth = (key: DirectionKey, month: number, current: number[]) => {
    setActiveMonths(
      key,
      current.includes(month)
        ? current.filter((m) => m !== month)
        : [...current, month],
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold mb-1">Направления и виды работ</h2>
        <p className="text-sm text-brand-gray">
          Отметьте, в какие месяцы работает каждое направление. По умолчанию все
          направления включены во все месяцы. Выключенные во всех месяцах попадут
          в КП с пометкой «не входит». Внутри направления можно убрать лишние
          работы или добавить свои.
        </p>
      </div>

      {/* Матрица «направления × месяцы» */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 overflow-x-auto">
        <div className="min-w-[460px]">
          <div className="flex items-center gap-1 pb-2 mb-2 border-b border-gray-100 text-xs text-brand-gray">
            <div className="flex-1 font-semibold uppercase tracking-wide">
              Направление
            </div>
            {months.map((m) => (
              <div key={m} className="w-8 text-center font-semibold">
                {m}
              </div>
            ))}
            <div className="w-20" />
          </div>

          {directions.map((d) => {
            const active = new Set(d.activeMonths);
            const included = d.activeMonths.length > 0;
            const allOn = d.activeMonths.length === durationMonths;
            return (
              <div key={d.key} className="flex items-center gap-1 py-1">
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate ${
                      included ? "" : "text-brand-gray"
                    }`}
                    title={d.name}
                  >
                    {d.name}
                  </div>
                </div>
                {months.map((m) => {
                  const on = active.has(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMonth(d.key, m, d.activeMonths)}
                      aria-pressed={on}
                      title={`Месяц ${m}`}
                      className={`w-8 h-8 rounded-md grid place-items-center text-xs transition ${
                        on
                          ? "bg-brand-green text-white"
                          : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </button>
                  );
                })}
                <div className="w-20 flex justify-end gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveMonths(d.key, allOn ? [] : months)}
                    className="rounded px-1.5 py-1 text-brand-greenDark hover:bg-brand-green/10"
                  >
                    {allOn ? "снять" : "все"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Аккордеоны для выбора работ */}
      {directions.map((d) => {
        const catalog = WORKS_CATALOG_BY_KEY[d.key].works;
        const checked = new Set(
          d.works.filter((w) => !w.custom).map((w) => w.text),
        );
        const customWorks = d.works.filter((w) => w.custom);
        const isOpen = expanded === d.key;
        const included = d.activeMonths.length > 0;
        const monthsLabel = formatMonthRanges(d.activeMonths, durationMonths);

        const toggleWork = (text: string) => {
          const next = new Set(checked);
          if (next.has(text)) next.delete(text);
          else next.add(text);
          const rebuilt: WorkItem[] = [
            ...catalog.filter((t) => next.has(t)).map((t) => ({ text: t })),
            ...customWorks,
          ];
          updateDirection(d.key, { works: rebuilt });
        };

        return (
          <div
            key={d.key}
            className={`rounded-2xl border bg-white overflow-hidden transition ${
              included ? "border-gray-300" : "border-gray-200 opacity-70"
            }`}
          >
            <button
              type="button"
              className="flex items-center gap-3 p-4 w-full text-left"
              onClick={() => setExpanded(isOpen ? null : d.key)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{d.name}</span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      included
                        ? "bg-brand-green/10 text-brand-greenDark"
                        : "bg-gray-200 text-brand-gray"
                    }`}
                  >
                    {included ? monthsLabel : "не входит"}
                  </span>
                </div>
                <div className="text-xs text-brand-gray italic mt-0.5">
                  {d.goal}
                </div>
              </div>
              <span className="text-sm text-brand-gray whitespace-nowrap">
                {d.works.length} работ
              </span>
              <span
                className={`text-brand-gray transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-200 p-4 space-y-2">
                {catalog.map((text) => (
                  <label
                    key={text}
                    className="flex gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(text)}
                      onChange={() => toggleWork(text)}
                      className="mt-1 accent-brand-green shrink-0"
                    />
                    <span>{text}</span>
                  </label>
                ))}

                {customWorks.map((w, i) => (
                  <div
                    key={`custom-${i}`}
                    className="flex gap-2 text-sm items-start bg-brand-yellow/10 rounded p-1"
                  >
                    <span className="mt-0.5 text-brand-green shrink-0">＋</span>
                    <span className="flex-1">{w.text}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateDirection(d.key, {
                          works: d.works.filter((x) => x !== w),
                        })
                      }
                      className="text-brand-gray hover:text-red-600 shrink-0"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <AddCustom
                  onAdd={(text) =>
                    updateDirection(d.key, {
                      works: [...d.works, { text, custom: true }],
                    })
                  }
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddCustom({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };
  return (
    <div className="flex gap-2 pt-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="Добавить свою работу…"
        className="ui-input"
      />
      <button type="button" onClick={add} className="ui-btn-ghost whitespace-nowrap">
        Добавить
      </button>
    </div>
  );
}
