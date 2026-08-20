"use client";

import ManagerAvatar, { managerPhotoUrl } from "@/components/ManagerAvatar";
import type { Manager, ProposalManager } from "@/lib/types";

interface Props {
  /** Заголовок шага: «Менеджер» или «Project-менеджер». */
  title: string;
  /** Пояснение, куда именно эти контакты попадут в КП. */
  hint: string;
  /** Справочник из настроек (Настройки → Список менеджеров). */
  managers: Manager[];
  manager: ProposalManager;
  /** id выбранного из справочника; null — данные введены/изменены вручную. */
  managerId: string | null;
  onSelect: (m: Manager) => void;
  onPatch: (patch: Partial<ProposalManager>) => void;
}

/**
 * Шаг выбора человека из справочника. Используется дважды и **независимо**:
 * менеджер, подготовивший КП (обложка), и Project-менеджер проекта (свой
 * слайд) — это, как правило, разные люди.
 */
export default function StepManager({
  title,
  hint,
  managers,
  manager,
  managerId,
  onSelect,
  onPatch,
}: Props) {
  // Выбор человека обязателен: КП без менеджера не сохраняется.
  const empty = !manager.name.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">{title}</h2>
        <p className="text-sm text-brand-gray">{hint}</p>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gray mb-2">
          Из справочника
        </h3>
        {managers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-brand-gray">
            Справочник пуст — заполните его в разделе «Настройки → Список
            менеджеров».
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {managers.map((m) => {
              const active = managerId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelect(m)}
                  className={`text-left rounded-xl border px-4 py-3 transition ${
                    active
                      ? "border-brand-green bg-brand-greenSoft ring-2 ring-brand-green/30"
                      : "border-gray-300 bg-white hover:border-brand-green"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ManagerAvatar
                      src={managerPhotoUrl(m)}
                      name={m.name}
                      size={40}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold">{m.name}</div>
                      {m.role && (
                        <div className="text-xs text-brand-gray">{m.role}</div>
                      )}
                      <div className="text-xs text-brand-gray mt-1">
                        {[m.phone, m.email].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {empty && (
          <p className="mt-3 text-sm text-red-600">
            Выберите человека из справочника или заполните данные вручную — без
            этого КП не сохранится.
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200">
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gray mb-3">
          Данные для этого КП
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Имя Фамилия">
            <input
              type="text"
              value={manager.name}
              placeholder="Андрей Марушко"
              onChange={(e) => onPatch({ name: e.target.value })}
              className="ui-input"
            />
          </Field>
          <Field label="Специальность">
            <input
              type="text"
              value={manager.role}
              placeholder="IT Account-менеджер Qmedia"
              onChange={(e) => onPatch({ role: e.target.value })}
              className="ui-input"
            />
          </Field>
          <Field label="Телефон">
            <input
              type="text"
              value={manager.phone}
              placeholder="+375 (29) 000-00-00"
              onChange={(e) => onPatch({ phone: e.target.value })}
              className="ui-input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={manager.email}
              placeholder="name@qmedia.by"
              onChange={(e) => onPatch({ email: e.target.value })}
              className="ui-input"
            />
          </Field>
          <Field label="Ссылка на резюме">
            <input
              type="url"
              value={manager.resumeUrl ?? ""}
              placeholder="https://www.qmedia.by/andrej_zhuk.html"
              onChange={(e) => onPatch({ resumeUrl: e.target.value })}
              className="ui-input"
            />
          </Field>
        </div>
        <p className="text-xs text-brand-gray mt-2">
          {managerId
            ? "Данные взяты из справочника. Правки здесь коснутся только этого КП — справочник не изменится."
            : "Данные вводятся вручную — только для этого КП."}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
