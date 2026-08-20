"use client";

import { useState } from "react";
import Link from "next/link";
import CostPanel from "./CostPanel";
import StepProject from "./StepProject";
import StepDirections from "./StepDirections";
import StepManager from "./StepManager";
import StepReview from "./StepReview";
import { buildWorksCatalog, type WorksConfig } from "@/lib/works-config";
import type { CalcConfig } from "@/lib/calc-config";
import type { DirectionCatalogEntry } from "@/lib/works-catalog";
import type {
  DirectionSelection,
  Manager,
  ProposalInput,
  ProposalManager,
  ProposalMeta,
} from "@/lib/types";

const DEFAULT_INPUT: ProposalInput = {
  siteName: "",
  region: "Минск",
  durationMonths: 3,
  audience: "все",
  promoteType: "услуги",
  pages: "до 50",
  experience: "Не было",
  errors: "Единичные",
  linkBuilding: "Базово",
  competition: "Средняя",
};

function allMonths(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/**
 * Стартовый набор направлений: тексты работ копируются из каталога настроек —
 * дальше КП живёт со своей копией, и правка настроек его уже не трогает.
 */
function initDirections(catalog: DirectionCatalogEntry[]): DirectionSelection[] {
  return catalog.map((d) => ({
    key: d.key,
    name: d.name,
    goal: d.goal,
    // По умолчанию направление активно во все месяцы срока.
    activeMonths: allMonths(DEFAULT_INPUT.durationMonths),
    works: d.works.map((text) => ({ text })),
  }));
}

/**
 * Пересчитать активные месяцы при смене срока: при уменьшении обрезаем хвост;
 * при увеличении продлеваем только направления, активные в прежнем последнем
 * месяце (тогда «полные» остаются полными, а обрывающиеся не «оживают»).
 */
function remapMonths(
  current: number[],
  oldDuration: number,
  newDuration: number,
): number[] {
  if (newDuration <= oldDuration) {
    return current.filter((m) => m <= newDuration);
  }
  const wasActiveLast = current.includes(oldDuration);
  if (!wasActiveLast) return current;
  const extra: number[] = [];
  for (let m = oldDuration + 1; m <= newDuration; m++) extra.push(m);
  return [...current, ...extra];
}

const STEPS = ["Параметры", "Направления", "Менеджер", "Project-менеджер", "Генерация"];

const EMPTY_MANAGER: ProposalManager = {
  name: "",
  role: "",
  phone: "",
  email: "",
  resumeUrl: "",
};

/**
 * `id` переносим в КП намеренно: по нему при рендере PDF находится фото в
 * таблице `manager_photos` (см. lib/pdf/photos.ts). Ручная правка любого поля
 * отвязывает КП от справочника и сбрасывает `id` — иначе в КП было бы чужое фото.
 */
const toProposalManager = (m: Manager): ProposalManager => ({
  id: m.id,
  name: m.name,
  role: m.role,
  phone: m.phone,
  email: m.email,
  resumeUrl: m.resumeUrl,
});

/**
 * `config` — снимок настроек расчёта, загруженный на сервере (app/new/page.tsx):
 * по нему считается предпросмотр, а сервер при сохранении применит те же значения.
 * `works` — заготовки работ по направлениям из настроек, `managers` — справочник
 * для шага «Менеджер».
 */
export default function Wizard({
  config,
  works,
  managers,
}: {
  config: CalcConfig;
  works: WorksConfig;
  managers: Manager[];
}) {
  // Каталог фиксируется на время работы визарда: правка настроек в соседней
  // вкладке не должна на лету менять уже размеченные работы.
  const [catalog] = useState<DirectionCatalogEntry[]>(() =>
    buildWorksCatalog(works),
  );
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<ProposalInput>(DEFAULT_INPUT);
  const [meta, setMeta] = useState<ProposalMeta>({});
  const [directions, setDirections] = useState<DirectionSelection[]>(() =>
    initDirections(catalog),
  );
  // По умолчанию — первый менеджер справочника (пустой справочник → ручной ввод).
  const [managerId, setManagerId] = useState<string | null>(
    managers[0]?.id ?? null,
  );
  const [manager, setManager] = useState<ProposalManager>(() =>
    managers[0] ? toProposalManager(managers[0]) : EMPTY_MANAGER,
  );
  // Project-менеджер выбирается независимо: КП часто готовит продавец, а ведёт
  // проект другой человек. Но выбрать его тоже обязательно — «не указан» нет.
  const [pmId, setPmId] = useState<string | null>(
    managers[0]?.id ?? null,
  );
  const [projectManager, setProjectManager] = useState<ProposalManager>(() =>
    managers[0] ? toProposalManager(managers[0]) : EMPTY_MANAGER,
  );
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Любое изменение содержимого сбрасывает факт сохранения.
  const patchInput = (patch: Partial<ProposalInput>) => {
    setInput((s) => {
      // При смене срока пересобираем активные месяцы каждого направления.
      if (patch.durationMonths && patch.durationMonths !== s.durationMonths) {
        const oldD = s.durationMonths;
        const newD = patch.durationMonths;
        setDirections((dirs) =>
          dirs.map((d) => ({
            ...d,
            activeMonths: remapMonths(d.activeMonths, oldD, newD),
          })),
        );
      }
      return { ...s, ...patch };
    });
    setSavedId(null);
  };
  const patchMeta = (patch: Partial<ProposalMeta>) => {
    setMeta((s) => ({ ...s, ...patch }));
    setSavedId(null);
  };
  const changeDirections = (next: DirectionSelection[]) => {
    setDirections(next);
    setSavedId(null);
  };
  /** Выбор из справочника — обязателен (варианта «не указывать» нет). */
  const selectManager = (m: Manager) => {
    setManagerId(m.id);
    setManager(toProposalManager(m));
    setSavedId(null);
  };
  // Ручная правка отвязывает от справочника: данные касаются только этого КП.
  const patchManager = (patch: Partial<ProposalManager>) => {
    setManager((s) => ({ ...s, ...patch, id: undefined }));
    setManagerId(null);
    setSavedId(null);
  };
  const selectProjectManager = (m: Manager) => {
    setPmId(m.id);
    setProjectManager(toProposalManager(m));
    setSavedId(null);
  };
  const patchProjectManager = (patch: Partial<ProposalManager>) => {
    setProjectManager((s) => ({ ...s, ...patch, id: undefined }));
    setPmId(null);
    setSavedId(null);
  };

  // Оба человека обязательны: без имени шаг не пройден и КП не сохраняется.
  const stepBlocked =
    (step === 2 && !manager.name.trim()) ||
    (step === 3 && !projectManager.name.trim());

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          directions,
          meta,
          // Оба человека обязательны — форма не даёт сохранить без них.
          manager,
          projectManager,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Ошибка сервера (${res.status})`);
      }
      const data = await res.json();
      setSavedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-sm text-brand-gray hover:text-brand-greenDark"
        >
          ← К списку КП
        </Link>
        <Stepper step={step} onJump={setStep} />
        <div className="w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="rounded-2xl bg-white border border-gray-200 p-6">
          {step === 0 && (
            <StepProject
              input={input}
              meta={meta}
              onInput={patchInput}
              onMeta={patchMeta}
            />
          )}
          {step === 1 && (
            <StepDirections
              directions={directions}
              catalog={catalog}
              durationMonths={input.durationMonths}
              onChange={changeDirections}
            />
          )}
          {step === 2 && (
            <StepManager
              title="Менеджер"
              hint="Эти контакты попадут на обложку КП («Подготовлено») и в блок контактов. Выберите человека из справочника или укажите данные вручную."
              managers={managers}
              manager={manager}
              managerId={managerId}
              onSelect={selectManager}
              onPatch={patchManager}
            />
          )}
          {step === 3 && (
            <StepManager
              title="Project-менеджер"
              hint="Тот, кто будет вести проект. Попадёт на слайд «Project-менеджер» и в состав команды. Выбор независим от менеджера, подготовившего КП."
              managers={managers}
              manager={projectManager}
              managerId={pmId}
              onSelect={selectProjectManager}
              onPatch={patchProjectManager}
            />
          )}
          {step === 4 && (
            <StepReview
              input={input}
              directions={directions}
              meta={meta}
              manager={manager}
              projectManager={projectManager}
              config={config}
              savedId={savedId}
              saving={saving}
              error={error}
              onSave={save}
            />
          )}

          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="ui-btn-ghost"
            >
              Назад
            </button>
            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={stepBlocked}
                className="ui-btn-primary"
              >
                Далее
              </button>
            )}
          </div>
        </div>

        <CostPanel input={input} directions={directions} config={config} />
      </div>
    </div>
  );
}

function Stepper({
  step,
  onJump,
}: {
  step: number;
  onJump: (s: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onJump(i)}
          className="flex items-center gap-2"
        >
          <span
            className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold transition ${
              i === step
                ? "bg-brand-green text-white ring-2 ring-brand-green/30"
                : i < step
                  ? "bg-brand-greenDark text-white"
                  : "bg-gray-200 text-brand-gray"
            }`}
          >
            {i + 1}
          </span>
          <span
            className={`text-sm hidden sm:inline ${
              i === step ? "font-semibold" : "text-brand-gray"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="text-gray-300 mx-1">—</span>
          )}
        </button>
      ))}
    </div>
  );
}
