"use client";

import { useState } from "react";
import type { Manager } from "@/lib/types";

/** Пустая форма нового менеджера. */
const emptyDraft = (): Omit<Manager, "id"> => ({
  name: "",
  role: "",
  phone: "",
  email: "",
});

export default function SettingsManagers({
  initialManagers,
}: {
  initialManagers: Manager[];
}) {
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Omit<Manager, "id">>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  /** Любое изменение списка сразу уходит на сервер: список — единая настройка. */
  const persist = async (next: Manager[], message: string) => {
    setSaving(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/settings/managers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managers: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Ошибка сервера (${res.status})`);
      setManagers(data.managers as Manager[]);
      setDone(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить список");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startAdd = () => {
    setDraft(emptyDraft());
    setEditing("new");
    setDone(null);
  };

  const startEdit = (m: Manager) => {
    setDraft({ name: m.name, role: m.role, phone: m.phone, email: m.email });
    setEditing(m.id);
    setDone(null);
  };

  const submit = async () => {
    const name = draft.name.trim();
    if (!name) {
      setError("Укажите имя и фамилию");
      return;
    }
    const value = {
      name,
      role: draft.role.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
    };
    const next =
      editing === "new"
        ? [...managers, { id: crypto.randomUUID(), ...value }]
        : managers.map((m) => (m.id === editing ? { ...m, ...value } : m));
    const ok = await persist(
      next,
      editing === "new" ? "Менеджер добавлен" : "Изменения сохранены",
    );
    if (ok) setEditing(null);
  };

  const remove = async (m: Manager) => {
    if (!confirm(`Удалить менеджера «${m.name}»?`)) return;
    if (editing === m.id) setEditing(null);
    await persist(
      managers.filter((x) => x.id !== m.id),
      "Менеджер удалён",
    );
  };

  return (
    <div className="space-y-4">
      <div className="ui-note">
        Эти люди доступны для выбора на шаге <b>«Менеджер»</b> при создании КП.
        Выбранные контакты попадают на обложку PDF («Подготовил») и в блок
        контактов в конце презентации. В уже сохранённых КП остаются те данные,
        которые были выбраны при их создании.
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {done && !error && (
        <div className="text-sm text-brand-greenDark font-medium">{done}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {managers.map((m) =>
          editing === m.id ? (
            <ManagerForm
              key={m.id}
              title="Редактирование"
              draft={draft}
              saving={saving}
              onChange={setDraft}
              onSubmit={submit}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div
              key={m.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-2"
            >
              <div>
                <div className="font-bold">{m.name}</div>
                {m.role && (
                  <div className="text-sm text-brand-gray">{m.role}</div>
                )}
              </div>
              <div className="text-sm space-y-0.5">
                {m.phone && <div>{m.phone}</div>}
                {m.email && (
                  <div className="text-brand-greenDark">{m.email}</div>
                )}
                {!m.phone && !m.email && (
                  <div className="text-brand-gray text-xs">
                    Контакты не заполнены
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  disabled={saving}
                  className="ui-btn-ghost text-xs px-3 py-1.5"
                >
                  Изменить
                </button>
                <button
                  type="button"
                  onClick={() => remove(m)}
                  disabled={saving}
                  className="ui-btn-ghost text-xs px-3 py-1.5 hover:border-red-400 hover:text-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          ),
        )}

        {editing === "new" && (
          <ManagerForm
            title="Новый менеджер"
            draft={draft}
            saving={saving}
            onChange={setDraft}
            onSubmit={submit}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>

      {managers.length === 0 && editing !== "new" && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-brand-gray">
          Список пуст. В КП будут подставляться контакты по умолчанию из
          lib/company.ts.
        </div>
      )}

      {editing !== "new" && (
        <button
          type="button"
          onClick={startAdd}
          disabled={saving}
          className="ui-btn-primary"
        >
          + Добавить менеджера
        </button>
      )}
    </div>
  );
}

function ManagerForm({
  title,
  draft,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  draft: Omit<Manager, "id">;
  saving: boolean;
  onChange: (d: Omit<Manager, "id">) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const field = (
    label: string,
    key: keyof Omit<Manager, "id">,
    placeholder: string,
    type = "text",
  ) => (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        type={type}
        value={draft[key]}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...draft, [key]: e.target.value })}
        className="ui-input"
      />
    </label>
  );

  return (
    <div className="rounded-2xl border border-brand-green/50 bg-white p-4 space-y-3">
      <div className="font-bold text-sm uppercase tracking-wide text-brand-gray">
        {title}
      </div>
      {field("Имя Фамилия", "name", "Андрей Марушко")}
      {field("Специальность", "role", "IT Account-менеджер Qmedia")}
      {field("Телефон", "phone", "+375 (29) 000-00-00")}
      {field("Email", "email", "name@qmedia.by", "email")}
      <div className="flex gap-2 pt-1">
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
