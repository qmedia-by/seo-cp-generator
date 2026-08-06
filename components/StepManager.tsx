"use client";

import type { Manager, ProposalManager } from "@/lib/types";

interface Props {
  /** Справочник из настроек (Настройки → Список менеджеров). */
  managers: Manager[];
  manager: ProposalManager;
  /** id выбранного из справочника; null — данные введены/изменены вручную. */
  managerId: string | null;
  onSelect: (m: Manager | null) => void;
  onPatch: (patch: Partial<ProposalManager>) => void;
}

export default function StepManager({
  managers,
  manager,
  managerId,
  onSelect,
  onPatch,
}: Props) {
  const empty = !manager.name.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Менеджер</h2>
        <p className="text-sm text-brand-gray">
          Эти контакты попадут в PDF: на обложку («Подготовил») и в блок контактов
          в конце презентации. Выберите человека из справочника или укажите данные
          вручную.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gray mb-2">
          Из справочника
        </h3>
        {managers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-brand-gray">
            Справочник пуст — заполните его в разделе «Настройки → Список
            менеджеров» или введите данные вручную ниже.
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
                  <div className="font-semibold">{m.name}</div>
                  {m.role && (
                    <div className="text-xs text-brand-gray">{m.role}</div>
                  )}
                  <div className="text-xs text-brand-gray mt-1">
                    {[m.phone, m.email].filter(Boolean).join(" · ") || "—"}
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={`text-left rounded-xl border border-dashed px-4 py-3 transition ${
                empty
                  ? "border-brand-green bg-brand-greenSoft ring-2 ring-brand-green/30"
                  : "border-gray-300 bg-white hover:border-brand-green"
              }`}
            >
              <div className="font-semibold">Не указывать</div>
              <div className="text-xs text-brand-gray mt-1">
                В КП попадут контакты по умолчанию из lib/company.ts
              </div>
            </button>
          </div>
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
