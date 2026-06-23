"use client";

import { useState } from "react";
import Link from "next/link";
import CostPanel from "./CostPanel";
import StepProject from "./StepProject";
import StepDirections from "./StepDirections";
import StepReview from "./StepReview";
import { WORKS_CATALOG } from "@/lib/works-catalog";
import type {
  DirectionSelection,
  ProposalInput,
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

function initDirections(): DirectionSelection[] {
  return WORKS_CATALOG.map((d) => ({
    key: d.key,
    name: d.name,
    goal: d.goal,
    included: true,
    works: d.works.map((text) => ({ text })),
  }));
}

const STEPS = ["Параметры", "Направления", "Генерация"];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<ProposalInput>(DEFAULT_INPUT);
  const [meta, setMeta] = useState<ProposalMeta>({});
  const [directions, setDirections] = useState<DirectionSelection[]>(
    initDirections,
  );
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Любое изменение содержимого сбрасывает факт сохранения.
  const patchInput = (patch: Partial<ProposalInput>) => {
    setInput((s) => ({ ...s, ...patch }));
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

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, directions, meta }),
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
            <StepDirections directions={directions} onChange={changeDirections} />
          )}
          {step === 2 && (
            <StepReview
              input={input}
              directions={directions}
              meta={meta}
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
                className="ui-btn-primary"
              >
                Далее
              </button>
            )}
          </div>
        </div>

        <CostPanel input={input} directions={directions} />
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
