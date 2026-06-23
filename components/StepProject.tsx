"use client";

import {
  AUDIENCE_OPTIONS,
  COMPETITION_OPTIONS,
  ERRORS_OPTIONS,
  EXPERIENCE_OPTIONS,
  LINK_BUILDING_OPTIONS,
  PAGES_OPTIONS,
  PROMOTE_TYPE_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/seo-config";
import type { ProposalInput, ProposalMeta } from "@/lib/types";

interface Props {
  input: ProposalInput;
  meta: ProposalMeta;
  onInput: (patch: Partial<ProposalInput>) => void;
  onMeta: (patch: Partial<ProposalMeta>) => void;
}

export default function StepProject({ input, meta, onInput, onMeta }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Параметры проекта</h2>
        <p className="text-sm text-brand-gray">
          На основе этих данных рассчитывается стоимость по каждому направлению.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Название сайта" required full>
          <input
            type="text"
            value={input.siteName}
            onChange={(e) => onInput({ siteName: e.target.value })}
            placeholder="example.by"
            className="ui-input"
          />
        </Field>

        <Select
          label="Регион продвижения"
          value={input.region}
          options={REGION_OPTIONS}
          onChange={(v) => onInput({ region: v })}
        />

        <Field label="Срок продвижения">
          <div className="flex gap-2">
            {[3, 6].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onInput({ durationMonths: m as 3 | 6 })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  input.durationMonths === m
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-gray-300 bg-white hover:border-brand-green"
                }`}
              >
                {m} месяца
              </button>
            ))}
          </div>
        </Field>

        <Select
          label="Для кого"
          value={input.audience}
          options={AUDIENCE_OPTIONS}
          onChange={(v) => onInput({ audience: v })}
        />
        <Select
          label="Что продвигаем"
          value={input.promoteType}
          options={PROMOTE_TYPE_OPTIONS}
          onChange={(v) => onInput({ promoteType: v })}
        />
        <Select
          label="Количество страниц"
          value={input.pages}
          options={PAGES_OPTIONS}
          onChange={(v) => onInput({ pages: v })}
        />
        <Select
          label="Предыдущий опыт SEO"
          value={input.experience}
          options={EXPERIENCE_OPTIONS}
          onChange={(v) => onInput({ experience: v })}
        />
        <Select
          label="Наличие ошибок"
          value={input.errors}
          options={ERRORS_OPTIONS}
          onChange={(v) => onInput({ errors: v })}
        />
        <Select
          label="Ссылочное продвижение"
          value={input.linkBuilding}
          options={LINK_BUILDING_OPTIONS}
          onChange={(v) => onInput({ linkBuilding: v })}
        />
        <Select
          label="Конкуренция"
          value={input.competition}
          options={COMPETITION_OPTIONS}
          onChange={(v) => onInput({ competition: v })}
        />
      </div>

      <div className="pt-2 border-t border-gray-200">
        <h3 className="text-sm font-bold mb-3 text-brand-gray uppercase tracking-wide">
          Клиент (необязательно)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Имя клиента / компания">
            <input
              type="text"
              value={meta.clientName ?? ""}
              onChange={(e) => onMeta({ clientName: e.target.value })}
              className="ui-input"
            />
          </Field>
          <Field label="Email клиента">
            <input
              type="email"
              value={meta.clientEmail ?? ""}
              onChange={(e) => onMeta({ clientEmail: e.target.value })}
              className="ui-input"
            />
          </Field>
          <Field label="Заметки" full>
            <textarea
              value={meta.notes ?? ""}
              onChange={(e) => onMeta({ notes: e.target.value })}
              rows={2}
              className="ui-input resize-y"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-brand-green"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="ui-input"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}
