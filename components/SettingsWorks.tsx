"use client";

import { useState } from "react";
import { DIRECTION_ORDER } from "@/lib/seo-config";
import { WORKS_CATALOG_BY_KEY } from "@/lib/works-catalog";
import { cloneWorksConfig, type WorksConfig } from "@/lib/works-config";
import type { DirectionKey } from "@/lib/types";

/** Что сейчас редактируется: работа с индексом или новая в конце списка. */
type Editing = { key: DirectionKey; index: number | "new" } | null;

export default function SettingsWorks({
  initialWorks,
}: {
  initialWorks: WorksConfig;
}) {
  const [works, setWorks] = useState<WorksConfig>(() =>
    cloneWorksConfig(initialWorks),
  );
  const [open, setOpen] = useState<DirectionKey | null>(DIRECTION_ORDER[0]);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  /** Любое изменение сразу уходит на сервер: списки работ — единая настройка. */
  const persist = async (next: WorksConfig, message: string) => {
    setSaving(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/settings/works", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ works: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Ошибка сервера (${res.status})`);
      // Берём ответ сервера: он канонизирует текст (пробелы, дубли).
      setWorks(data.works as WorksConfig);
      setDone(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить список");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startAdd = (key: DirectionKey) => {
    setDraft("");
    setEditing({ key, index: "new" });
    setError(null);
    setDone(null);
  };

  const startEdit = (key: DirectionKey, index: number) => {
    setDraft(works[key][index]);
    setEditing({ key, index });
    setError(null);
    setDone(null);
  };

  const submit = async () => {
    if (!editing) return;
    const { key, index } = editing;
    const text = draft.trim().replace(/\s+/g, " ");
    if (!text) {
      setError("Текст работы не может быть пустым");
      return;
    }
    const duplicate = works[key].some(
      (w, i) => w === text && i !== (index === "new" ? -1 : index),
    );
    if (duplicate) {
      setError("Такая работа в этом направлении уже есть");
      return;
    }
    const list =
      index === "new"
        ? [...works[key], text]
        : works[key].map((w, i) => (i === index ? text : w));
    const ok = await persist(
      { ...works, [key]: list },
      index === "new" ? "Работа добавлена" : "Работа изменена",
    );
    if (ok) setEditing(null);
  };

  const remove = async (key: DirectionKey, index: number) => {
    const text = works[key][index];
    if (!confirm(`Удалить работу «${short(text)}»?`)) return;
    setEditing(null);
    await persist(
      { ...works, [key]: works[key].filter((_, i) => i !== index) },
      "Работа удалена",
    );
  };

  /** Порядок важен: он же порядок карточек на слайде работ в PDF. */
  const move = async (key: DirectionKey, index: number, delta: number) => {
    const target = index + delta;
    const list = [...works[key]];
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setEditing(null);
    await persist({ ...works, [key]: list }, "Порядок изменён");
  };

  return (
    <div className="space-y-4">
      <div className="ui-note">
        Это <b>заготовки работ</b>: на шаге «Направления» их можно отметить или
        снять, а при необходимости — дописать работу только для конкретного КП.
        <br />
        Тексты попадают в PDF (слайд «Состав работ») и в лист «План работ» Excel.
        Первое <b>тире</b> делит пункт на заголовок карточки и описание под ним:
        «Рост позиций — сбор и кластеризация ядра». Порядок работ в списке — это
        порядок карточек в презентации.
        <br />
        Правки действуют на <b>новые</b> КП: каждое сохранённое КП хранит копию
        текстов, поэтому его PDF и Excel не меняются задним числом.
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {done && !error && (
        <div className="text-sm text-brand-greenDark font-medium">{done}</div>
      )}

      {DIRECTION_ORDER.map((key) => {
        const entry = WORKS_CATALOG_BY_KEY[key];
        const list = works[key];
        const isOpen = open === key;
        return (
          <div
            key={key}
            className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              className="flex items-center gap-3 p-4 w-full text-left"
              onClick={() => setOpen(isOpen ? null : key)}
            >
              <div className="flex-1">
                <div className="font-bold">{entry.name}</div>
                <div className="text-xs text-brand-gray italic mt-0.5">
                  {entry.goal}
                </div>
              </div>
              <span className="text-sm text-brand-gray whitespace-nowrap">
                {list.length} работ
              </span>
              <span
                className={`text-brand-gray transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-200 p-4 space-y-2">
                {list.map((text, i) =>
                  editing?.key === key && editing.index === i ? (
                    <WorkForm
                      key={`edit-${i}`}
                      title="Редактирование работы"
                      draft={draft}
                      saving={saving}
                      onChange={setDraft}
                      onSubmit={submit}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <div
                      key={text}
                      className="flex gap-3 items-start rounded-lg border border-gray-200 p-3"
                    >
                      <span className="text-xs text-brand-gray w-5 shrink-0 pt-0.5 text-right">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm">{text}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <IconButton
                          label="Выше"
                          disabled={saving || i === 0}
                          onClick={() => move(key, i, -1)}
                        >
                          ↑
                        </IconButton>
                        <IconButton
                          label="Ниже"
                          disabled={saving || i === list.length - 1}
                          onClick={() => move(key, i, 1)}
                        >
                          ↓
                        </IconButton>
                        <button
                          type="button"
                          onClick={() => startEdit(key, i)}
                          disabled={saving}
                          className="ui-btn-ghost text-xs px-3 py-1.5"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(key, i)}
                          disabled={saving}
                          className="ui-btn-ghost text-xs px-3 py-1.5 hover:border-red-400 hover:text-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ),
                )}

                {list.length === 0 && editing?.key !== key && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-brand-gray">
                    Список пуст: в визарде у направления не будет готовых работ —
                    только те, что менеджер добавит вручную.
                  </div>
                )}

                {editing?.key === key && editing.index === "new" ? (
                  <WorkForm
                    title="Новая работа"
                    draft={draft}
                    saving={saving}
                    onChange={setDraft}
                    onSubmit={submit}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startAdd(key)}
                    disabled={saving}
                    className="ui-btn-primary"
                  >
                    + Добавить работу
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Обрезка длинного текста для окна подтверждения. */
function short(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="h-7 w-7 rounded-md border border-gray-300 bg-white text-sm text-brand-gray transition hover:border-brand-green hover:text-brand-greenDark disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-brand-gray"
    >
      {children}
    </button>
  );
}

function WorkForm({
  title,
  draft,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  draft: string;
  saving: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-brand-green/50 bg-white p-3 space-y-2">
      <div className="font-bold text-xs uppercase tracking-wide text-brand-gray">
        {title}
      </div>
      <textarea
        value={draft}
        rows={3}
        autoFocus
        placeholder="Заголовок работы — описание того, что делаем."
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter отправляет (перенос строки в пункте каталога всё равно не нужен),
          // Shift+Enter оставляем на случай ручного форматирования.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="ui-input resize-y"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="ui-btn-primary"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="ui-btn-ghost"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
