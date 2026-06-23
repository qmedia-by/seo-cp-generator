"use client";

import { useState } from "react";
import { WORKS_CATALOG_BY_KEY } from "@/lib/works-catalog";
import type { DirectionSelection, WorkItem } from "@/lib/types";

interface Props {
  directions: DirectionSelection[];
  onChange: (next: DirectionSelection[]) => void;
}

export default function StepDirections({ directions, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(directions[0]?.key ?? null);

  const updateDirection = (
    key: string,
    patch: Partial<DirectionSelection>,
  ) => {
    onChange(directions.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-1">Направления и виды работ</h2>
        <p className="text-sm text-brand-gray">
          Все 5 направлений попадут в КП. Выключенные будут показаны с пометкой
          «не входит в продвижение». Внутри направления можно убрать лишние
          работы или добавить свои.
        </p>
      </div>

      {directions.map((d) => {
        const catalog = WORKS_CATALOG_BY_KEY[d.key].works;
        const checked = new Set(
          d.works.filter((w) => !w.custom).map((w) => w.text),
        );
        const customWorks = d.works.filter((w) => w.custom);
        const isOpen = expanded === d.key;

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
              d.included ? "border-gray-300" : "border-gray-200 opacity-70"
            }`}
          >
            <div className="flex items-center gap-3 p-4">
              <Toggle
                on={d.included}
                onClick={() => updateDirection(d.key, { included: !d.included })}
              />
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => setExpanded(isOpen ? null : d.key)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{d.name}</span>
                  {!d.included && (
                    <span className="text-xs rounded-full bg-gray-200 text-brand-gray px-2 py-0.5">
                      не входит
                    </span>
                  )}
                </div>
                <div className="text-xs text-brand-gray italic mt-0.5">
                  {d.goal}
                </div>
              </button>
              <span className="text-sm text-brand-gray whitespace-nowrap">
                {d.works.length} работ
              </span>
              <span
                className={`text-brand-gray transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </div>

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

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition shrink-0 ${
        on ? "bg-brand-green" : "bg-gray-300"
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
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
