"use client";

// Круглое фото менеджера — общий кусок настроек (`SettingsManagers`) и шага
// «Менеджер» в визарде (`StepManager`).
//
// Сами байты лежат в таблице `manager_photos`, в справочнике — только отпечаток
// `Manager.photoVersion` (см. lib/manager-photos.ts), поэтому адрес картинки
// собирается здесь, а не приходит с сервера.

/**
 * Адрес фото; нет фото — `null`. Штамп версии обязателен: ответ кэшируется
 * «навсегда», и без него браузер показывал бы старую картинку после замены.
 */
export function managerPhotoUrl(m: {
  id: string;
  photoVersion?: string;
}): string | null {
  return m.photoVersion
    ? `/api/settings/managers/${encodeURIComponent(m.id)}/photo?v=${m.photoVersion}`
    : null;
}

/** Фото менеджера; нет фото — инициалы на светло-зелёном. */
export default function ManagerAvatar({
  src,
  name,
  size,
}: {
  /** Готовый адрес картинки или data-URL превью; `null` — показать инициалы. */
  src: string | null;
  name: string;
  size: number;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Жёлтая рамка — та самая «мелкая графика», для которой фирменный #FFDE00 и
  // годится (текстом он нечитаем, см. конвенции в CLAUDE.md).
  return (
    <div
      className="shrink-0 flex items-center justify-center overflow-hidden rounded-full border-2 border-brand-yellow bg-brand-greenSoft font-bold text-brand-greenDark"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}
