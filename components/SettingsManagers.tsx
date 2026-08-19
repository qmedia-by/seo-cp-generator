"use client";

import { useEffect, useState } from "react";
import ManagerAvatar, { managerPhotoUrl } from "@/components/ManagerAvatar";
import type { ManagersSyncSummary } from "@/lib/qmedia-managers";
import type { Manager } from "@/lib/types";

/** Черновик формы: всё, что правится текстовыми полями (фото — отдельно). */
type Draft = Omit<Manager, "id" | "photoVersion">;

/** Пустая форма нового менеджера. */
const emptyDraft = (): Draft => ({
  name: "",
  role: "",
  phone: "",
  email: "",
  resumeUrl: "",
});

/** До какого квадрата ужимаем загруженное фото (аватарка на сайте — 180 px). */
const PHOTO_SIDE = 512;

/**
 * Прочитать выбранный файл и отдать data-URL для отправки на сервер.
 *
 * Ужимаем прямо в браузере: иначе с телефона легко прилетит фотография на
 * несколько мегабайт, а от неё в аватарке 48×48 толку нет. Кадрируем по центру
 * в квадрат — именно так фото и показывается.
 */
async function toPhotoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Нужен файл с картинкой: JPEG, PNG или WebP");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Не удалось прочитать картинку — попробуйте другой файл");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(side, PHOTO_SIDE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не смог обработать картинку");

  // Белая подложка: прозрачный PNG иначе стал бы чёрным квадратом в JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function SettingsManagers({
  initialManagers,
}: {
  initialManagers: Manager[];
}) {
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // Что делаем с фото при сохранении формы: `undefined` — не трогаем,
  // `null` — удалить, строка — поставить этот data-URL.
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [plan, setPlan] = useState<ManagersSyncSummary | null>(null);
  // Отдельно от `error`: ошибки синхронизации показываются в модалке, иначе их
  // не видно — кнопка синхронизации внизу, а общий блок ошибки вверху секции.
  const [syncError, setSyncError] = useState<string | null>(null);

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

  /**
   * Фото едет отдельным запросом: в справочнике лежит только отпечаток, а сами
   * байты — в своей таблице. Вызывается после сохранения списка, чтобы у нового
   * менеджера уже был id (иначе `saveManagers` тут же снёс бы фото как ничьё).
   */
  const persistPhoto = async (id: string, data: string | null) => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/settings/managers/${encodeURIComponent(id)}/photo`,
        data === null
          ? { method: "DELETE" }
          : {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data }),
            },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Ошибка сервера (${res.status})`);
      const version = (body.photoVersion as string | null) ?? undefined;
      setManagers((list) =>
        list.map((m) => (m.id === id ? { ...m, photoVersion: version } : m)),
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить фото");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startAdd = () => {
    setDraft(emptyDraft());
    setPhoto(undefined);
    setEditing("new");
    setDone(null);
  };

  const startEdit = (m: Manager) => {
    setDraft({
      name: m.name,
      role: m.role,
      phone: m.phone,
      email: m.email,
      resumeUrl: m.resumeUrl,
    });
    setPhoto(undefined);
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
      resumeUrl: draft.resumeUrl.trim(),
    };
    const id = editing === "new" ? crypto.randomUUID() : String(editing);
    const next =
      editing === "new"
        ? [...managers, { id, ...value }]
        : managers.map((m) => (m.id === id ? { ...m, ...value } : m));
    const ok = await persist(
      next,
      editing === "new" ? "Менеджер добавлен" : "Изменения сохранены",
    );
    if (!ok) return;
    if (photo !== undefined && !(await persistPhoto(id, photo))) return;
    setEditing(null);
  };

  const remove = async (m: Manager) => {
    if (!confirm(`Удалить менеджера «${m.name}»?`)) return;
    if (editing === m.id) setEditing(null);
    await persist(
      managers.filter((x) => x.id !== m.id),
      "Менеджер удалён",
    );
  };

  /** Шаг 1: спросить сайт и показать, что изменится (ничего не сохраняя). */
  const previewSync = async () => {
    setSyncing(true);
    setError(null);
    setDone(null);
    setPlan(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/settings/managers/sync", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Ошибка сервера (${res.status})`);
      setPlan(data as ManagersSyncSummary);
    } catch (e) {
      setSyncError(
        e instanceof Error ? e.message : "Не удалось получить данные с сайта",
      );
    } finally {
      setSyncing(false);
    }
  };

  /** Шаг 2: применить. Сервер пересчитывает план заново по свежей странице. */
  const applySync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/settings/managers/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Ошибка сервера (${res.status})`);
      const s = data as ManagersSyncSummary & { managers: Manager[] };
      setManagers(s.managers);
      setEditing(null);
      setPlan(null);
      setError(null);
      setDone(
        `Синхронизировано с qmedia.by: добавлено ${s.added.length}, обновлено ${s.updated.length}, удалено ${s.removed.length}.`,
      );
      // Итог и обновлённый список — вверху секции, а кнопка синхронизации внизу.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSyncError(
        e instanceof Error ? e.message : "Не удалось применить синхронизацию",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="ui-note">
        Эти люди доступны для выбора на шагах <b>«Менеджер»</b> и{" "}
        <b>«Project-менеджер»</b> при создании КП. Менеджер попадает на обложку
        PDF («Подготовлено»), Project-менеджер — на свой слайд и в состав
        команды. В уже сохранённых КП остаются те данные, которые были выбраны
        при их создании.
        <br />
        Кнопка <b>«Забрать с qmedia.by»</b> сверяет список с блоком
        «Персональные менеджеры» на сайте: сайт — главный источник, лишние
        удаляются, недостающие добавляются, фото и ссылки на резюме берутся из
        карточек. Сначала покажем, что изменится.
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
              photo={photo}
              currentPhoto={managerPhotoUrl(m)}
              onChange={setDraft}
              onPhoto={setPhoto}
              onSubmit={submit}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div
              key={m.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <ManagerAvatar src={managerPhotoUrl(m)} name={m.name} size={48} />
                <div className="min-w-0">
                  <div className="font-bold">{m.name}</div>
                  {m.role && (
                    <div className="text-sm text-brand-gray">{m.role}</div>
                  )}
                </div>
              </div>
              <div className="text-sm space-y-0.5">
                {m.phone && <div>{m.phone}</div>}
                {m.email && (
                  <div className="text-brand-greenDark">{m.email}</div>
                )}
                {m.resumeUrl && (
                  <a
                    href={m.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-gray underline hover:text-brand-greenDark"
                  >
                    Резюме
                  </a>
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
            photo={photo}
            currentPhoto={null}
            onChange={setDraft}
            onPhoto={setPhoto}
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

      <div className="flex flex-wrap items-center gap-2">
        {editing !== "new" && (
          <button
            type="button"
            onClick={startAdd}
            disabled={saving || syncing}
            className="ui-btn-primary"
          >
            + Добавить менеджера
          </button>
        )}
        <button
          type="button"
          onClick={previewSync}
          disabled={saving || syncing}
          className="ui-btn-ghost"
          title="Сверить справочник с блоком «Персональные менеджеры» на qmedia.by"
        >
          {syncing ? "Смотрим сайт…" : "↻ Забрать с qmedia.by"}
        </button>
      </div>

      {(plan || syncError) && (
        <SyncPlan
          plan={plan}
          error={syncError}
          busy={syncing}
          onApply={applySync}
          onCancel={() => {
            setPlan(null);
            setSyncError(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Предпросмотр синхронизации: что изменится, если применить.
 *
 * Именно модалка, а не блок в потоке страницы: кнопка «Забрать с qmedia.by»
 * живёт под списком из десятка карточек, и панель наверху секции оказывалась
 * за краем экрана — выглядело как «нажал, и ничего не произошло» (наступали).
 */
function SyncPlan({
  plan,
  error,
  busy,
  onApply,
  onCancel,
}: {
  plan: ManagersSyncSummary | null;
  error: string | null;
  busy: boolean;
  onApply: () => void;
  onCancel: () => void;
}) {
  const changed =
    !!plan &&
    (plan.added.length > 0 ||
      plan.updated.length > 0 ||
      plan.removed.length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const group = (title: string, names: string[], className: string) =>
    names.length > 0 && (
      <div className="text-sm">
        <span className={`font-semibold ${className}`}>
          {title} ({names.length}):
        </span>{" "}
        {names.join(", ")}
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Синхронизация с qmedia.by"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl space-y-3"
      >
        <div className="font-bold text-sm uppercase tracking-wide text-brand-gray">
          Данные с qmedia.by
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        ) : !plan ? null : changed ? (
          <div className="space-y-1.5">
            {group("Добавить", plan.added, "text-brand-greenDark")}
            {group("Обновить", plan.updated, "text-brand-ink")}
            {group("Удалить", plan.removed, "text-red-600")}
            {group("Скачать фото", plan.photosChanged, "text-brand-greenDark")}
            {plan.unchanged.length > 0 && (
              <div className="text-sm text-brand-gray">
                Без изменений: {plan.unchanged.length}
              </div>
            )}
            <div className="text-xs text-brand-gray pt-1">
              Имя, специальность, телефон, email, резюме и фото берутся с сайта; ручные
              правки этих полей будут перезаписаны.
            </div>
          </div>
        ) : (
          <div className="text-sm text-brand-gray">
            Справочник уже совпадает с сайтом ({plan.unchanged.length}{" "}
            менеджеров).
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {changed && (
            <button
              type="button"
              onClick={onApply}
              disabled={busy}
              className="ui-btn-primary"
            >
              {busy ? "Применяем…" : "Применить"}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="ui-btn-ghost"
          >
            {changed ? "Отмена" : "Закрыть"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagerForm({
  title,
  draft,
  saving,
  photo,
  currentPhoto,
  onChange,
  onPhoto,
  onSubmit,
  onCancel,
}: {
  title: string;
  draft: Draft;
  saving: boolean;
  /** Черновик фото: `undefined` — не трогаем, `null` — удалить, строка — новое. */
  photo: string | null | undefined;
  /** Адрес уже сохранённого фото (null — его нет). */
  currentPhoto: string | null;
  onChange: (d: Draft) => void;
  onPhoto: (next: string | null | undefined) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  // Ошибка выбора файла живёт в форме: общий блок ошибок — вверху секции, а
  // при десятке карточек его отсюда не видно.
  const [photoError, setPhotoError] = useState<string | null>(null);
  const preview = photo === undefined ? currentPhoto : photo;

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Сбрасываем input, иначе повторный выбор того же файла не даст события.
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    try {
      onPhoto(await toPhotoDataUrl(file));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Не удалось прочитать файл");
    }
  };

  const field = (
    label: string,
    key: keyof Draft,
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

      <div className="flex items-center gap-3">
        <ManagerAvatar src={preview} name={draft.name} size={64} />
        <div className="flex flex-col items-start gap-1">
          <label
            className={`ui-btn-ghost text-xs px-3 py-1.5 ${
              saving ? "pointer-events-none opacity-50" : "cursor-pointer"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={saving}
              onChange={pickPhoto}
            />
            {preview ? "Заменить фото" : "Загрузить фото"}
          </label>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPhotoError(null);
                onPhoto(null);
              }}
              disabled={saving}
              className="text-xs text-brand-gray hover:text-red-600"
            >
              Удалить фото
            </button>
          )}
          <span className="text-xs text-brand-gray">
            JPEG, PNG или WebP. Обрежем по центру в квадрат {PHOTO_SIDE} px.
          </span>
        </div>
      </div>
      {photoError && <div className="text-xs text-red-600">{photoError}</div>}

      {field("Имя Фамилия", "name", "Андрей Марушко")}
      {field("Специальность", "role", "IT Account-менеджер Qmedia")}
      {field("Телефон", "phone", "+375 (29) 000-00-00")}
      {field("Email", "email", "name@qmedia.by", "email")}
      {field(
        "Ссылка на резюме",
        "resumeUrl",
        "https://www.qmedia.by/andrej_zhuk.html",
        "url",
      )}
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
